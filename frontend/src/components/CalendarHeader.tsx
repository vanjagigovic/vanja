// import { AppBar, Box, Toolbar, Typography, useTheme } from "@mui/material";
// import { calendarHeaderSubtitleSx, calendarToolbarSx } from "../styles/calendarStyles";

// interface CalendarHeaderProps {
//     appTitle: string;
//     appSubtitle: string;
//     isMobile: boolean;
// }

// export function CalendarHeader({
//     appTitle,
//     appSubtitle,
//     isMobile,
// }: CalendarHeaderProps){

//     const theme = useTheme();
//     return(
//         <AppBar position="static" elevation={0} sx={{backgroundColor: theme.custom.fills.transparent}}>
//             <Toolbar sx={calendarToolbarSx}>
//                 <Box>
//                     <Typography variant={isMobile? 'h5': 'h4'} fontWeight={700}>{appTitle}</Typography>
//                     <Typography color="text.secondary" sx={calendarHeaderSubtitleSx}>{appSubtitle}</Typography>
//                 </Box>
//             </Toolbar>
//         </AppBar>
//     );
// }