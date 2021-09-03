import { SnackbarProvider } from 'notistack';
import { 
  Typography, AppBar, Toolbar, createMuiTheme, Button, Box, ThemeProvider
} from '@material-ui/core';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

import SelectAppChain from 'views/SelectAppChain';
import Transfer from 'views/Transfer';

import logo from 'assets/octopus_logo_black.svg';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#53ab90',
      contrastText: '#fff'
    },
    secondary: {
      main: 'rgb(86, 90, 105)',
      dark: 'rgb(0, 0, 0)',
    },
  },
  overrides: {
    MuiButton: {
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none'
        }
      }
    }
  },
  shape: {
    borderRadius: 10
  }
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    header: {
      background: 'transparent',
      paddingTop: '15px'
    },
    content: {
      padding: 20,
      paddingTop: '16vh',
      height: '100vh',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      boxAlign: 'center',
      flexDirection: 'column'
    }
  }),
);

const App = () => {
  const classes = useStyles();
 
  return (
    <SnackbarProvider anchorOrigin={{
      vertical: 'top', horizontal: 'center',
    }} maxSnack={3}>
      <ThemeProvider theme={theme}>
        <div style={{ 
          height: '100vh'
        }}>
          <AppBar position="fixed" className={classes.header} elevation={0}>
            <Toolbar>
              <Box>
                <img src={logo} height={64} />
              </Box>
              <div style={{ flexGrow: 1 }} />
           
            </Toolbar>
          </AppBar>
          <div className={classes.content}>
            <Typography variant="h4" display="inline">Octopus Bridge</Typography>
            <div style={{ marginTop: 50 }} />
            <Router>
              <Routes>
                <Route path='' element={<SelectAppChain />} />
                <Route path='/:appchain' element={<Transfer />} />
              </Routes>
            </Router>
          </div>
        </div>
      </ThemeProvider>
    </SnackbarProvider>
  );
}

export default App;