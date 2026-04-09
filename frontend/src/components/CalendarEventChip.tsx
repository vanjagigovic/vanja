import { motion } from "framer-motion";
import { getEventTypeColors } from "../types/event-types";
import type { CalendarEvent } from "../types/types";
import { Chip, useTheme} from "@mui/material";
import { eventMotionProps } from "../helpers/motion-presets";
import { monthEventChipSx } from "../styles/eventStyles";
import { NotificationsActiveOutlined } from "@mui/icons-material";

interface CalendarEventChipProps {
    event: CalendarEvent;
    isMobile: boolean;
    onClick: () => void;
}


export function CalendarEventChip({ event, isMobile, onClick }: CalendarEventChipProps) {
    const theme = useTheme();
    const colors = getEventTypeColors(theme, event.eventType);
    return (
        <motion.div {...eventMotionProps}>
            <Chip
                label={event.title}
                size='small'
                icon={event.reminderEnabled ? <NotificationsActiveOutlined /> : undefined }
                onClick={(e) => {e.stopPropagation()
                onClick();
            }}
            sx={monthEventChipSx(colors, isMobile)}
            />
        </motion.div>
    )
}