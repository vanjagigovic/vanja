import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Snackbar,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
//components
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarControls } from "./CalendarControls";
import { CalendarFeedback } from "./CalendarFeedback";
import { CalendarTimeGrid } from "./CalendarTimeGrid";
import { EventDialog } from "./EventDialog";
//custom hooks
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { useCalendarUiState } from "../hooks/useCalendarUiState";
import { useCalendarViewModel } from "../hooks/useCalendarViewModel";
//helers
import {
  getCalendarControlText,
  getCalendarViewLabels,
} from "../helpers/calendar-presentation-helpers";
import {
  calendarLoadingContentSx,
  calendarPageSx,
} from "../styles/calendarStyles";
import { successSnackbarAlertSx } from "../styles/alertStyles";

const SLOT_HEIGHT = 40;
const SLOT_MINUTES = 30;
const HOURS_PER_DAY = 24;
const SLOTS_PER_DAY = 48;

export function Calendar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const {
    currentView,
    setCurrentView,
    currentDate,
    viewTimeZone,
    setViewTimeZone,
    modalState,
    timeZones,
    goPrevious,
    goNext,
    goToday,
    openCreateDialog,
    openCreateForSlot,
    openCreateForDay,
    openEditDialog,
    closeModal,
  } = useCalendarUiState();
  const {
    events,
    loading,
    error,
    suggestion,
    successMessage,
    setSuccessMessage,
    setSuggestion,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useCalendarEvents({
    currentView,
    currentDate,
    viewTimeZone,
    t,
  });
  const { rangeLabel, visibleDays, monthCells, isMonthView } =
    useCalendarViewModel({
      currentView,
      currentDate,
      viewTimeZone,
    });

  const headerText = {
    nextEventLabel: t("newEvent"),
    viewTimeZone: t("viewTimeZone"),
  };

  const controlText = getCalendarControlText(t);
  const viewLabels = getCalendarViewLabels(t);

  console.log("isMonthView =", isMonthView);
  console.log("KEY:", `${currentView}-${rangeLabel}`);
  function handleUseSuggestedTime(nextSuggestion: {
    startUtc: string;
    endUtc: string;
  }) {
    setSuggestion(null);
    openCreateDialog(nextSuggestion.startUtc, nextSuggestion.endUtc);
  }
  function renderContent() {
    if (loading) {
      return (
        <Card>
          <CardContent sx={calendarLoadingContentSx}>
            <Typography variant="h6">{t("loading")}</Typography>
            <Typography color="text.secondary">
              {t("loadingSubtitle")}
            </Typography>
            <Skeleton variant="rounded" height={44} />
            <Skeleton variant="rounded" height={isMobile ? 260 : 420} />
          </CardContent>
        </Card>
      );
    }
    if (isMonthView) {
      return renderMonthView();
    }
    return renderTimeGrid(visibleDays);
  }
  function renderTimeGrid(days: Date[]) {
    return (
      <CalendarTimeGrid
        days={days}
        events={events}
        viewTimeZone={viewTimeZone}
        isMobile={isMobile}
        isTablet={isTablet}
        slotHeight={SLOT_HEIGHT}
        slotMinutes={SLOT_MINUTES}
        slotsPerDay={SLOTS_PER_DAY}
        hoursPerDay={HOURS_PER_DAY}
        onOpenCreateForSlot={openCreateForSlot}
        onEditEvent={openEditDialog}
      />
    );
  }

  function renderMonthView() {
    return (
      <CalendarMonthGrid
        cells={monthCells}
        currentDate={currentDate}
        events={events}
        viewTimeZone={viewTimeZone}
        isMobile={isMobile}
        onOpenCreateForDay={openCreateForDay}
        onEditEvent={openEditDialog}
      />
    );
  }

  return (
    <>
      <Box sx={calendarPageSx}>
        <CalendarControls
          isMobile={isMobile}
          currentView={currentView}
          rangeLabel={rangeLabel}
          previousLabel={controlText.previuosLabel}
          todayLabel={controlText.todayLabel}
          nextLabel={controlText.nextLabel}
          newEventLabel={headerText.nextEventLabel}
          viewTimeZoneLabel={headerText.viewTimeZone}
          timeZones={timeZones}
          viewTimeZone={viewTimeZone}
          viewLabels={viewLabels}
          onPrevious={goPrevious}
          onToday={goToday}
          onNext={goNext}
          onCreateEvent={() => openCreateDialog()}
          onViewTimeZoneChange={setViewTimeZone}
          onChangeView={setCurrentView}
        />

        <CalendarFeedback
          error={error}
          suggestion={suggestion}
          suggestionLabel={controlText.suggestionLabel}
          suggestionActionLabel={controlText.suggestionActionLabel}
          viewTimeZone={viewTimeZone}
          onUseSuggestedTime={handleUseSuggestedTime}
        />

        <AnimatePresence mode="wait">
          <motion.div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
            key={`${currentView}-${rangeLabel}`}
          >
            <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {renderContent()}
            </Box>
          </motion.div>
        </AnimatePresence>


      </Box>

      {modalState?.mode === "create" ? (
        <EventDialog
          event={null}
          initialStartUtc={modalState.startUtc}
          initialEndUtc={modalState.endUtc}
          onClose={closeModal}
          onSave={handleCreate}
        />
      ) : null}

      {modalState?.mode === "edit" ? (
        <EventDialog
          event={modalState.event}
          onClose={closeModal}
          onSave={(payload) =>
            handleUpdate(modalState.event.baseEventId, payload)
          }
          onDelete={() => handleDelete(modalState.event.baseEventId)}
        />
      ) : null}

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage("")}
          sx={successSnackbarAlertSx}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(suggestion)}
        autoHideDuration={7000}
        onClose={() => setSuggestion(null)}
      >
        <Box />
      </Snackbar>
    </>
  );
}
