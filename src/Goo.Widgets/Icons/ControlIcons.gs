package Goo.Widgets.Icons

import Goo
import System

internal enum ControlIcon {
    ArrowDownward;
    ArrowUpward;
    AttachFile;
    CalendarMonth;
    Check;
    CheckBox;
    CheckBoxOutlineBlank;
    CheckCircle;
    ChevronLeft;
    ChevronRight;
    Close;
    ContentCopy;
    CropSquare;
    DoneAll;
    Download;
    Error;
    ExpandLess;
    ExpandMore;
    FilterNone;
    FindReplace;
    Info;
    MatchCase;
    MatchWord;
    Pause;
    PlayArrow;
    RegularExpression;
    Remove;
    RestartAlt;
    Search;
    SkipNext;
    SkipPrevious;
    Visibility;
    VisibilityOff;
    Warning
}

internal class ControlIcons {
    shared {
        internal func Create(icon ControlIcon, size float64 = 24.0, color Color? = nil, useCurrentColor bool = false) Shape {
            var name string
            switch icon {
                case ControlIcon.ArrowDownward { name = "arrow_downward" }
                case ControlIcon.ArrowUpward { name = "arrow_upward" }
                case ControlIcon.AttachFile { name = "attach_file" }
                case ControlIcon.CalendarMonth { name = "calendar_month" }
                case ControlIcon.Check { name = "check" }
                case ControlIcon.CheckBox { name = "check_box" }
                case ControlIcon.CheckBoxOutlineBlank { name = "check_box_outline_blank" }
                case ControlIcon.CheckCircle { name = "check_circle" }
                case ControlIcon.ChevronLeft { name = "chevron_left" }
                case ControlIcon.ChevronRight { name = "chevron_right" }
                case ControlIcon.Close { name = "close" }
                case ControlIcon.ContentCopy { name = "content_copy" }
                case ControlIcon.CropSquare { name = "crop_square" }
                case ControlIcon.DoneAll { name = "done_all" }
                case ControlIcon.Download { name = "download" }
                case ControlIcon.Error { name = "error" }
                case ControlIcon.ExpandLess { name = "expand_less" }
                case ControlIcon.ExpandMore { name = "expand_more" }
                case ControlIcon.FilterNone { name = "filter_none" }
                case ControlIcon.FindReplace { name = "find_replace" }
                case ControlIcon.Info { name = "info" }
                case ControlIcon.MatchCase { name = "match_case" }
                case ControlIcon.MatchWord { name = "match_word" }
                case ControlIcon.Pause { name = "pause" }
                case ControlIcon.PlayArrow { name = "play_arrow" }
                case ControlIcon.RegularExpression { name = "regular_expression" }
                case ControlIcon.Remove { name = "remove" }
                case ControlIcon.RestartAlt { name = "restart_alt" }
                case ControlIcon.Search { name = "search" }
                case ControlIcon.SkipNext { name = "skip_next" }
                case ControlIcon.SkipPrevious { name = "skip_previous" }
                case ControlIcon.Visibility { name = "visibility" }
                case ControlIcon.VisibilityOff { name = "visibility_off" }
                case ControlIcon.Warning { name = "warning" }
                default { throw ArgumentOutOfRangeException("icon") }
            }
            return MaterialIcons.Create(name, size, color, useCurrentColor)
        }
    }
}
