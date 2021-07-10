import { useState, useEffect } from 'react';

import BaseModal from "./BaseModal";
import { List, ListItem, ListItemAvatar, ListItemText, Avatar, Box, Typography } from '@material-ui/core';
import { ChevronRight, Info } from '@material-ui/icons';
import SwipeableViews from 'react-swipeable-views';
import { isWeb3Injected, web3FromSource, web3Enable, web3Accounts } from '@polkadot/extension-dapp';

import nearLogo from 'assets/near_logo.png';
import pjsLogo from 'assets/polkadot_js_logo.png';

const AccountModal = ({
  open,
  onClose,
  isRedeem,
  onChange
}: {
  open: boolean;
  onClose: VoidFunction;
  isRedeem: boolean;
  onChange: Function;
}) => {

  const [showPJSAccounts, setShowPJSAccounts] = useState(false);
  const [pjsAccounts, setPJSAccounts] = useState([]);
  
  useEffect(() => {
    if (open) {
      web3Enable('Octopus Bridge').then(res => {
        web3Accounts().then(accounts => {
          setPJSAccounts(accounts);
        });
      });
    } else {
      setShowPJSAccounts(false);
    }
  }, [open]);

  const onConnectToNear = () => {
    if (!window.accountId) {
      const { walletConnection } = window;
      walletConnection.requestSignIn(
        walletConnection._near.config.contractName,
        "Octopus Bridge"
      );
      localStorage.setItem('isRedeem', '0');
    } else {
      onChange(false);
    }
    
  }

  const onSelectPJSAccount = (address) => {
    window.pjsAccount = address;
    window.localStorage.setItem('pjsAccount', address);
    localStorage.setItem('isRedeem', '1');
    onChange(true);
  }

  return (
    <BaseModal open={open} onClose={onClose} title="Choose Account">
      <SwipeableViews index={showPJSAccounts ? 1 : 0}>
        <List>
          <ListItem button divider style={{ opacity: isRedeem ? 0.5 : 1 }}
            onClick={onConnectToNear}>
            <ListItemAvatar>
              <Avatar alt="Near logo" src={nearLogo} />
            </ListItemAvatar>
            <ListItemText secondary="Near account" primary={window.accountId || 'Login'} />
            <ChevronRight style={{ color: '#aaa'}} />
          </ListItem>
          <ListItem button  style={{ opacity: isRedeem ? 1 : 0.5 }}
            onClick={() => setShowPJSAccounts(true)}>
            <ListItemAvatar>
              <Avatar alt="Polkadot.js logo" src={pjsLogo} />
            </ListItemAvatar>
            <ListItemText secondary="Polkadot.js" primary={
              window.pjsAccount ? `${window.pjsAccount.substr(0,10)}...${window.pjsAccount.substr(-10)}` : 
              'No account'
            } />
            
            <ChevronRight style={{ color: '#aaa'}} />
          </ListItem>
        </List>
        
        {
          isWeb3Injected ?
          pjsAccounts.length ?
          <List>
          {

            pjsAccounts.map(({ address, meta }, idx) => (
              <ListItem key={`listitem-${idx}`} button divider={idx < pjsAccounts.length - 1} 
                onClick={() => onSelectPJSAccount(address)}>
                <ListItemText secondary={meta.name} primary={`${address.substr(0, 10)}...${address.substr(-10)}`} />
                <ChevronRight />
              </ListItem>
            )) 
          }
          </List> :
          <Box display="flex" alignItems="center" justifyContent="center" height={120} style={{ color: '#7c7c7c' }}>
            <Info />
            <Typography>No accounts, please import account via extension</Typography>
          </Box> :
          <Box display="flex" alignItems="center" justifyContent="center" height={120} style={{ color: '#7c7c7c' }}>
            <Info />
            <Typography>Please install Polkadot.js first</Typography>
          </Box>
        }

      </SwipeableViews>
    </BaseModal>
  );
}

export default AccountModal;