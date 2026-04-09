import { useState } from "react";
import { DateTime } from 'luxon';
import type { CalendarEvent } from '../types/types';

type ModalState = 
| {mode: 'create'; startUtc?: string; endUtc?: string}
| {mode: 'edit'; event: CalendarEvent}
| null;

type UseCalendarModalParams = {
    viewTimeZone: string;
};

export function useCalendarModal({viewTimeZone}: UseCalendarModalParams) {
    const [modalState, setModalState] = useState<ModalState>(null);

     function openCreateDialog(startUtc?: string, endUtc?: string){
        setModalState({mode:'create', startUtc, endUtc})
    }

    function openCreateForSlot(startUtc: string){
        setModalState({mode: 'create', startUtc});
    }

    function openCreateForDay(day: Date){ 
        const zonedStart = DateTime.fromJSDate(day).setZone(viewTimeZone).set({hour: 9, minute: 0, second: 0, millisecond:0});
        const zonedEnd = zonedStart.plus({hours: 1});
        setModalState({mode: 'create', startUtc: zonedStart.toUTC().toISO()?? undefined, endUtc: zonedEnd.toUTC().toISO()?? undefined})
    }

    function openEditDialog(event: CalendarEvent){
        setModalState({mode: 'edit', event});
    }

    function closeModal(){
        setModalState(null);
    }

    return { 
        modalState,
        openCreateDialog,
        openCreateForDay,
        openCreateForSlot,
        openEditDialog,
        closeModal
    }
}