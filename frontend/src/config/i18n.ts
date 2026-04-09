import i18next from "i18next";
import { initReactI18next } from "react-i18next";

void i18next.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    },
    resources: { 
        en: {
            translation: {
                appTitle: 'Calendar',
                appSubtitle: 'Single-user calendar',
                newEvent: 'New event',
                previous: 'previous',
                next: 'next',
                today: 'Today',
                day: 'Day',
                week: 'Week',
                month: 'Month',
                title: 'Title',
                start: 'Start',
                end: 'End',
                timeZone:'Time zone',
                viewTimeZone: "View time zone",
                eventType: 'Event type',
                repeatWeekly: 'Repeat Weekly',
                repeatUntil: 'Repeat Until',
                reminderEnabled: 'Remind 10 minutes before',
                createEvent: 'New event',
                editEvent: 'Edit event', 
                cancel: 'Cancel',
                save: 'Save',
                delete: 'Delete',
                confirmDeleteTitle: 'Delete Event?',
                confirmDeleteMessage: 'This action cannot be undone',
                confirmDelete: 'Delete event',
                useSuggestedTime: 'Use suggested time',
                loading: 'Loading events...',
                loadingSubtitle: 'Syncing your calendar for the selected range',
                noEventsTitle: 'No events in this range',
                noEventsSubtitle: 'Create your first event or switch the date range to see scheduled items',
                createFirstEvent:'Create first event',
                workingHours: 'Working hours',
                suggestion: 'Suggestion time',
                reminder:'Reminder',
                occurrence: 'Occurrence',
                eventCreated: 'Event created successfully',
                eventUpdateed: 'Event updated successfully',
                eventDelete: 'Event deleted successfully',
            },
        },
    },
});

export default i18next;