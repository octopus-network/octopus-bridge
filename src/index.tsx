import React from 'react';
import { connect, keyStores, WalletConnection, Contract } from "near-api-js";
import ReactDOM from 'react-dom';
import './index.css';

import App from './App';

const NETWORK = process.env.REACT_APP_OCT_NETWORK || 'testnet';
const CONTRACT_NAME = process.env.REACT_APP_OCT_RELAY_CONTRACT_NAME || 'dev-1627801128558-7635941';

const nearConfig = {
  networkId: NETWORK,
  nodeUrl: `https://rpc.${NETWORK}.near.org`,
  contractName: CONTRACT_NAME,
  walletUrl: `https://wallet.${NETWORK}.near.org`,
  helperUrl: `https://helper.${NETWORK}.near.org`,
  explorerUrl: `https://explorer.${NETWORK}.near.org`,
  tokenDecimal: 24
}

const initNear = async () => {
  const near = await connect(
    Object.assign(
      { deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } },
      nearConfig
    )
  );
  
  window.walletConnection = new WalletConnection(near, 'octopus_bridge');
  window.accountId = window.walletConnection.getAccountId();
  window.pjsAccount = window.localStorage.getItem('pjsAccount') || undefined;

  window.contract = await new Contract(
    window.walletConnection.account(),
    CONTRACT_NAME,
    {
      viewMethods: ['get_bridge_token', 'get_num_appchains', 'get_appchain', 'get_appchains', 'get_native_token'],
      changeMethods: []
    }
  );

} 

initNear()
  .then(() => {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      document.getElementById('root')
    );
  });

