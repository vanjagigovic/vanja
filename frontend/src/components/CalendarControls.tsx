import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  ButtonGroup,
  InputLabel,
  Select,
  Button,
  MenuItem,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import TodayIcon from "@mui/icons-material/Today";
import { motion } from "framer-motion";
import type { CalendarViewMode } from "../types/types";
import { pressableMotionProps } from "../helpers/motion-presets";
import {
  calendarActionGroupSx,
  calendarControlsContentSx,
  calendarHeroSectionSx,
  calendarHeroTitleSx,
  calendarNavButtonSx,
  calendarNavGroupSx,
  calendarPrimaryActionSx,
  calendarSurfaceCardSx,
  calendarTimeZoneControlSx,
  calendarTimeZoneMenuProps,
  calendarTodayButtonSx,
  calendarTopActionBarSx,
  calendarUpcomingEmptySx,
  calendarUpcomingItemSx,
  calendarUpcomingListSx,
  calendarUpcomingPanelSx,
  calendarUpcomingTimeSx,
  calendarUpcomingTitleSx,
  calendarViewButtonSx,
  calendarViewSwitcherSx,
} from "../styles/calendarStyles";

type UpcomongEventItem = {
  id: string;
  title: string;
  timeLabel: string;
}
interface CalendarControlsProps {
  isMobile: boolean;
  currentView: CalendarViewMode;
  rangeLabel: string;
  previousLabel: string;
  todayLabel: string;
  nextLabel: string;
  newEventLabel: string;
  viewTimeZoneLabel: string;
  upcomingEventsLabel: string;
  noUpcomingEventsLabel: string;
  timeZones: string[];
  viewTimeZone: string;
  viewLabels: Record<CalendarViewMode, string>;
  upcomingEvents: UpcomongEventItem[];
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  onCreateEvent: () => void;
  onViewTimeZoneChange: (value: string) => void;
  onChangeView: (view: CalendarViewMode) => void;
}

export function CalendarControls({
  isMobile,
  currentView,
  rangeLabel,
  todayLabel,
  newEventLabel,
  viewTimeZoneLabel,
  timeZones,
  viewTimeZone,
  upcomingEvents,
  upcomingEventsLabel,
  noUpcomingEventsLabel,
  viewLabels,
  onPrevious,
  onToday,
  onNext,
  onCreateEvent,
  onViewTimeZoneChange,
  onChangeView,
}: CalendarControlsProps) {
  return (
    <Card sx={calendarSurfaceCardSx}>
      <CardContent sx={calendarControlsContentSx}>
        <Box sx={calendarTopActionBarSx}>
          <Box sx={calendarUpcomingPanelSx}>
            <Typography sx={calendarUpcomingTitleSx}>{upcomingEventsLabel}</Typography>
            {upcomingEvents.length > 0 ? (
              <Box sx={calendarUpcomingListSx}>
                {upcomingEvents.map((event) => (
                  <Box key={event.id} sx={calendarUpcomingItemSx}>
                    <Typography sx={calendarUpcomingTimeSx}>{event.timeLabel}</Typography>
                    <Typography variant="body2" noWrap  sx={{ flex: 1 }}>{event.title}</Typography>
                  </ Box> 
                ))}
              </Box>
            ) : (
              <Typography sx={calendarUpcomingEmptySx}>{noUpcomingEventsLabel}</Typography>
            )}
          </Box>

          <Box sx={calendarHeroSectionSx}>
            <Typography component="h1" sx={calendarHeroTitleSx}>
              {rangeLabel}
            </Typography>

            <Box sx={calendarNavGroupSx}>
              <Button
                component={motion.button}
                {...pressableMotionProps}
                sx={calendarNavButtonSx}
                onClick={onPrevious}
              >
                <ChevronLeftIcon />
              </Button>

              <Button
                component={motion.button}
                {...pressableMotionProps}
                sx={calendarTodayButtonSx}
                onClick={onToday}
                startIcon={<TodayIcon />}
              >
                {todayLabel}
              </Button>

              <Button
                component={motion.button}
                {...pressableMotionProps}
                sx={calendarNavButtonSx}
                onClick={onNext}
              >
                <ChevronRightIcon />
              </Button>
            </Box>
          </Box>

          <Box sx={calendarActionGroupSx}>
            <FormControl sx={calendarTimeZoneControlSx} size="small">
              <InputLabel shrink>{viewTimeZoneLabel}</InputLabel>

              <Select
                label={viewTimeZoneLabel}
                value={viewTimeZone}
                onChange={(event) => onViewTimeZoneChange(event.target.value)}
                MenuProps={calendarTimeZoneMenuProps}
              >
                {timeZones.map((zone) => (
                  <MenuItem key={zone} value={zone}>
                    {zone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              component={motion.button}
              {...pressableMotionProps}
              variant="contained"
              sx={calendarPrimaryActionSx}
              startIcon={<AddIcon />}
              onClick={onCreateEvent}
            >
              {newEventLabel}
            </Button>
          </Box>
        </Box>

        <ButtonGroup
          variant="text"
          fullWidth={isMobile}
          orientation={isMobile ? "vertical" : "horizontal"}
          sx={calendarViewSwitcherSx}
        >
          {(["day", "week", "month"] as CalendarViewMode[]).map((view) => (
            <Button
              
              component={motion.button}
              {...pressableMotionProps}
              key={view}
              sx={calendarViewButtonSx(view === currentView)}
              onClick={() => onChangeView(view)}
            >
              {viewLabels[view]}
            </Button>
          ))}
        </ButtonGroup>
      </CardContent>
    </Card>
  );
}
