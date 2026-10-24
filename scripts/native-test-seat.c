#define _GNU_SOURCE
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <poll.h>
#include <libei.h>
#include <dbus/dbus.h>
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>
#include <errno.h>
#include <sys/wait.h>
#include <sys/prctl.h>
#include <linux/close_range.h>

static volatile sig_atomic_t stopped;
static void stop(int signal) { stopped = signal; }

static DBusConnection *eis_bus;
static void disconnect_eis(void) {
    if (!eis_bus) return;
    dbus_connection_close(eis_bus);
    dbus_connection_unref(eis_bus);
}

static int pass_fds(int first, int second) {
    if (close_range(3, ~0U, CLOSE_RANGE_CLOEXEC)) return -1;
    if (fcntl(first, F_SETFD, 0)) return -1;
    return second < 0 ? 0 : fcntl(second, F_SETFD, 0);
}
static int connect_eis(void) {
    const char *address = getenv("DBUS_SESSION_BUS_ADDRESS");
    if (!address || strncmp(address, "unix:", 5)) return -1;
    DBusError error = DBUS_ERROR_INIT;
    DBusConnection *bus = dbus_bus_get_private(DBUS_BUS_SESSION, &error);
    if (!bus) {
        fprintf(stderr, "%s\n", error.message);
        dbus_error_free(&error);
        return -1;
    }
    DBusMessage *request = dbus_message_new_method_call("org.kde.KWin",
        "/org/kde/KWin/EIS/RemoteDesktop", "org.kde.KWin.EIS.RemoteDesktop", "connectToEIS");
    dbus_int32_t capabilities = 3;
    dbus_message_append_args(request, DBUS_TYPE_INT32, &capabilities, DBUS_TYPE_INVALID);
    DBusMessage *reply = dbus_connection_send_with_reply_and_block(bus, request, 10000, &error);
    dbus_message_unref(request);
    int owned = -1;
    dbus_int32_t cookie;
    if (!reply || !dbus_message_get_args(reply, &error, DBUS_TYPE_UNIX_FD, &owned,
                                       DBUS_TYPE_INT32, &cookie, DBUS_TYPE_INVALID)) {
        if (owned >= 0) close(owned);
        owned = -1;
    }
    if (dbus_error_is_set(&error)) {
        fprintf(stderr, "%s\n", error.message);
        dbus_error_free(&error);
    }
    if (reply) dbus_message_unref(reply);
    if (owned >= 0) {
        eis_bus = bus;
        atexit(disconnect_eis);
    } else {
        dbus_connection_close(bus);
        dbus_connection_unref(bus);
    }
    return owned;
}

static void terminate(pid_t pid, int group) {
    if (pid <= 0) return;
    kill(group ? -pid : pid, SIGTERM);
    for (int i = 0; i < 50; i++) {
        if (waitpid(pid, NULL, WNOHANG) == pid) {
            if (group) kill(-pid, SIGKILL);
            return;
        }
        usleep(100000);
    }
    kill(group ? -pid : pid, SIGKILL);
    while (waitpid(pid, NULL, 0) < 0 && errno == EINTR) {}
}

static int launch(char **command) {
    if (close_range(3, ~0U, 0)) return 3;
    int eis = connect_eis();
    if (eis < 0) return 3;
    int input[2], ack[2];
    if (pipe2(input, O_CLOEXEC)) { close(eis); return 3; }
    if (pipe2(ack, O_CLOEXEC)) { close(eis); close(input[0]); close(input[1]); return 3; }
    pid_t parent = getpid();
    pid_t seat = fork();
    if (seat == 0) {
        prctl(PR_SET_PDEATHSIG, SIGKILL);
        if (getppid() != parent) _exit(3);
        dup2(input[0], STDIN_FILENO);
        dup2(ack[1], STDOUT_FILENO);
        close(input[0]); close(input[1]); close(ack[0]); close(ack[1]);
        if (pass_fds(eis, -1)) _exit(3);
        char fd[24];
        snprintf(fd, sizeof(fd), "%d", eis);
        execl("/proc/self/exe", "seat", fd, NULL);
        _exit(127);
    }
    close(eis); close(input[0]); close(ack[1]);
    if (seat < 0) { close(input[1]); close(ack[0]); return 3; }
    struct pollfd ready = {ack[0], POLLIN, 0};
    char response[6];
    int count = 0;
    for (; count < 6; count++) {
        if (poll(&ready, 1, 10000) <= 0 || read(ack[0], &response[count], 1) != 1) break;
    }
    int result = 3;
    if (count == 6 && !memcmp(response, "ready\n", 6)) {
        pid_t child = fork();
        if (child == 0) {
            setpgid(0, 0);
            prctl(PR_SET_PDEATHSIG, SIGKILL);
            if (getppid() != parent) _exit(3);
            if (pass_fds(input[1], ack[0])) _exit(3);
            char fd[24];
            snprintf(fd, sizeof(fd), "%d", input[1]);
            setenv("GOO_WIDGET_INPUT_COMMAND_FD", fd, 1);
            snprintf(fd, sizeof(fd), "%d", ack[0]);
            setenv("GOO_WIDGET_INPUT_ACK_FD", fd, 1);
            execvp(command[0], command);
            _exit(127);
        }
        if (child > 0) {
            setpgid(child, child);
            signal(SIGTERM, stop);
            signal(SIGINT, stop);
            int status = 0;
            result = 124;
            while (!stopped) {
                if (waitpid(child, &status, WNOHANG) == child) {
                    result = WIFEXITED(status) ? WEXITSTATUS(status) : -WTERMSIG(status);
                    kill(-child, SIGKILL);
                    child = -1;
                    break;
                }
                usleep(100000);
            }
            terminate(child, 1);
        }
    }
    close(input[1]); close(ack[0]);
    terminate(seat, 0);
    const char *path = getenv("GOO_WIDGET_RESULT");
    FILE *output = path ? fopen(path, "w") : NULL;
    if (!output) return 3;
    fprintf(output, "%d", result);
    fclose(output);
    return result;
}
static struct ei_device *pointer, *keyboard;
static int dispatch(struct ei *context) {
    ei_dispatch(context);
    struct ei_event *event;
    while ((event = ei_get_event(context))) {
        enum ei_event_type type = ei_event_get_type(event);
        if (type == EI_EVENT_DISCONNECT) return 1;
        if (type == EI_EVENT_SEAT_ADDED)
            ei_seat_bind_capabilities(ei_event_get_seat(event), EI_DEVICE_CAP_POINTER_ABSOLUTE, EI_DEVICE_CAP_BUTTON, EI_DEVICE_CAP_KEYBOARD, NULL);
        if (type == EI_EVENT_DEVICE_RESUMED) {
            struct ei_device *device = ei_event_get_device(event);
            if (ei_device_has_capability(device, EI_DEVICE_CAP_POINTER_ABSOLUTE)) pointer = ei_device_ref(device);
            if (ei_device_has_capability(device, EI_DEVICE_CAP_KEYBOARD)) keyboard = ei_device_ref(device);
            ei_device_start_emulating(device, 1);
        }
        ei_event_unref(event);
    }
    return 0;
}
static int run_case(const char *path, char **command) {
    pid_t parent = getpid();
    pid_t child = fork();
    if (child < 0) return 3;
    if (child == 0) {
        prctl(PR_SET_PDEATHSIG, SIGKILL);
        if (getppid() != parent) _exit(3);
        const char *input = getenv("GOO_WIDGET_INPUT_COMMAND_FD");
        const char *ack = getenv("GOO_WIDGET_INPUT_ACK_FD");
        if (!input || !ack || pass_fds(atoi(input), atoi(ack))) _exit(3);
        execvp(command[0], command);
        _exit(127);
    }
    int status;
    while (waitpid(child, &status, 0) < 0) {
        if (errno != EINTR) return 3;
    }
    FILE *output = fopen(path, "w");
    if (!output) return 3;
    fprintf(output, "%d", WIFEXITED(status) ? WEXITSTATUS(status) : -WTERMSIG(status));
    fclose(output);
    return 0;
}

int main(int argc, char **argv) {
    const char *socket = getenv("WAYLAND_DISPLAY");
    if (!socket || strcmp(socket, "goo-widgets")) return 2;
    if (argc > 2 && !strcmp(argv[1], "--launch")) return launch(&argv[2]);
    if (argc > 3 && !strcmp(argv[1], "--case")) return run_case(argv[2], &argv[3]);
    if (argc != 2) return 2;
    struct ei *context = ei_new_sender(NULL);
    ei_configure_name(context, "Goo isolated widget seat");
    if (ei_setup_backend_fd(context, atoi(argv[1]))) return 3;
    struct pollfd input = {ei_get_fd(context), POLLIN, 0};
    for (int i = 0; i < 100 && (!pointer || !keyboard); i++) {
        if (dispatch(context)) return 4;
        poll(&input, 1, 100);
    }
    if (!pointer || !keyboard) return 5;
    puts("ready"); fflush(stdout);
    struct pollfd events[2] = {{ei_get_fd(context), POLLIN, 0}, {0, POLLIN, 0}};
    while (poll(events, 2, -1) >= 0) {
        if (dispatch(context)) break;
        if (events[1].revents & POLLIN) {
            char command[128];
            if (!fgets(command, sizeof(command), stdin)) break;
            double x, y;
            unsigned code, pressed;
            if (sscanf(command, "move %lf %lf", &x, &y) == 2) {
                ei_device_pointer_motion_absolute(pointer, x, y);
                ei_device_frame(pointer, ei_now(context));
            } else if (sscanf(command, "button %u %u", &code, &pressed) == 2 && (code == 272 || code == 273) && pressed <= 1) {
                ei_device_button_button(pointer, code, pressed != 0);
                ei_device_frame(pointer, ei_now(context));
            } else {
                puts("invalid"); fflush(stdout);
                continue;
            }
            ei_dispatch(context);
            puts("ok"); fflush(stdout);
        }
        if (events[1].revents & POLLHUP) break;
    }
    ei_device_unref(pointer);
    ei_device_unref(keyboard);
    ei_unref(context);
    return 0;
}
