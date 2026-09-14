// Test input for an isolated KWin compositor; never connect to the user's desktop.
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <poll.h>
#include <libei.h>
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
int main(int argc, char **argv) {
    const char *socket = getenv("WAYLAND_DISPLAY");
    if (argc != 2 || !socket || strcmp(socket, "goo-widgets")) return 2;
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
    while (poll(&input, 1, -1) >= 0) {
        if (dispatch(context)) break;
    }
    ei_device_unref(pointer);
    ei_device_unref(keyboard);
    ei_unref(context);
    return 0;
}
