import { useState } from 'react';
import { SnackbarProvider } from 'notistack';
import { 
  IconButton, Typography,
  AppBar, Toolbar, createMuiTheme, Button, Box, ThemeProvider
} from '@material-ui/core';

import { PowerSettingsNew } from '@material-ui/icons';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import SelectAppChain from 'components/SelectAppChain';
import Transfer from 'components/Transfer';

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
  const [step, setStep] = useState(0);

  const [appchain, setAppchain] = useState({id: '', name: ''});

  const onSelectAppchain = (appchain) => {
    setAppchain(appchain);
    setStep(1);
  }

  const onLoginAccount = () => {
    const { walletConnection } = window;
    walletConnection.requestSignIn(
      walletConnection._near.config.contractName,
      "Octopus Bridge"
    );
  }

  const onLogout = () => {
    window.walletConnection.signOut();
    window.location.reload();
  }

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
              {
                window.accountId ?
                <Button variant="outlined" 
                  style={{ textTransform: 'none', background: '#fff', borderRadius: 20 }}>{window.accountId}</Button> :
                <Button variant="outlined" color="primary" onClick={onLoginAccount}
                  style={{ textTransform: 'none' }}>Connect to wallet</Button>
              }
              {
                window.accountId &&
                <Button variant="outlined" style={{ borderRadius: 20, padding: 5, marginLeft: 10, minWidth: 'auto' }} onClick={onLogout}>
                  <PowerSettingsNew />
                </Button>
              }
            </Toolbar>
          </AppBar>
          <div className={classes.content}>
            <Typography variant="h4" display="inline">Octopus Bridge</Typography>
            <div style={{ marginTop: 50 }} />
            {
              step === 0 &&
              <SelectAppChain onSelect={onSelectAppchain} />
            }
            {
              step === 1 &&
              <Transfer appchain={appchain} onBack={() => setStep(0)} />
            }
          </div>
        </div>
      </ThemeProvider>
    </SnackbarProvider>
  );
}

export default App;