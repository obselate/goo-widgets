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
        internal func Create(icon ControlIcon, size float64 = 24.0, color Color? = nil, useCurrentColor bool = false) Shape ->
            MaterialIcons.Create(
                switch icon {
                    case ControlIcon.ArrowDownward: "arrow_downward"
                    case ControlIcon.ArrowUpward: "arrow_upward"
                    case ControlIcon.AttachFile: "attach_file"
                    case ControlIcon.CalendarMonth: "calendar_month"
                    case ControlIcon.Check: "check"
                    case ControlIcon.CheckBox: "check_box"
                    case ControlIcon.CheckBoxOutlineBlank: "check_box_outline_blank"
                    case ControlIcon.CheckCircle: "check_circle"
                    case ControlIcon.ChevronLeft: "chevron_left"
                    case ControlIcon.ChevronRight: "chevron_right"
                    case ControlIcon.Close: "close"
                    case ControlIcon.ContentCopy: "content_copy"
                    case ControlIcon.CropSquare: "crop_square"
                    case ControlIcon.DoneAll: "done_all"
                    case ControlIcon.Download: "download"
                    case ControlIcon.Error: "error"
                    case ControlIcon.ExpandLess: "expand_less"
                    case ControlIcon.ExpandMore: "expand_more"
                    case ControlIcon.FilterNone: "filter_none"
                    case ControlIcon.FindReplace: "find_replace"
                    case ControlIcon.Info: "info"
                    case ControlIcon.MatchCase: "match_case"
                    case ControlIcon.MatchWord: "match_word"
                    case ControlIcon.Pause: "pause"
                    case ControlIcon.PlayArrow: "play_arrow"
                    case ControlIcon.RegularExpression: "regular_expression"
                    case ControlIcon.Remove: "remove"
                    case ControlIcon.RestartAlt: "restart_alt"
                    case ControlIcon.Search: "search"
                    case ControlIcon.SkipNext: "skip_next"
                    case ControlIcon.SkipPrevious: "skip_previous"
                    case ControlIcon.Visibility: "visibility"
                    case ControlIcon.VisibilityOff: "visibility_off"
                    case ControlIcon.Warning: "warning"
                    default: throw ArgumentOutOfRangeException("icon")
                },
                size, color, useCurrentColor
            )
    }
}
