import { Calendar } from "./components/Calendar";
import { formatDateKey } from "./utils/calendar-utils";
import { Route,Routes, Navigate } from "react-router-dom";

function CalendarRedirect() {
  return (
    <Navigate to={`/calendar/month/${formatDateKey(new Date())}`} replace />
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<CalendarRedirect />} />
      <Route path="/calendar/:view/:date" element={<Calendar />} />
      <Route path="*" element={<CalendarRedirect />} />
    </Routes>
  );
}
