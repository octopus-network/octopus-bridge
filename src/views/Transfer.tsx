import { useEffect, useState, useRef, useCallback } from 'react';
import { Contract } from 'near-api-js';

import { decodeAddress } from '@polkadot/util-crypto';
import { stringToHex, u8aToHex, formatBalance } from '@polkadot/util';
import { useSnackbar } from 'notistack';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3FromSource, web3Enable } from '@polkadot/extension-dapp';

import { useNavigate, useParams } from 'react-router-dom';

import BigNumber from 'bignumber.js';

import { 
  Box, Typography, ListItem, FormControl, Paper, IconButton,
  InputLabel, OutlinedInput, InputAdornment, Button, CircularProgress, Avatar
} from '@material-ui/core';

import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { fromDecimals, toDecimals } from 'utils';
import { SwapHoriz, ArrowDownward, Person, ChevronLeft, ExpandMore, Close } from '@material-ui/icons';
import SelectTokenModal from 'components/SelectTokenModal';
import AccountModal from 'components/AccountModal';
import Polling from 'components/Polling';

import nearLogo from 'assets/near_logo.png';
import pjsLogo from 'assets/polkadot_js_logo.png';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    form: {
      boxShadow: 'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px',
      marginTop: 30,
      width: '100%',
      maxWidth: 395,
      boxSizing: 'border-box',
      padding: 20
    }
  }),
);

const BOATLOAD_OF_GAS = new BigNumber(3).times(10 ** 14).toFixed();
const MINIMUM_DEPOSIT = new BigNumber(125).times(10 ** 19).toFixed();

const tokenId2AssetId = {
  'usdc.testnet': 0
}

const localSelectedToken = window.localStorage.getItem('selectedToken');

const Transfer = () => {
  const { appchain } = useParams();
  const navigate = useNavigate();

  const classes = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [appchainInfo, setAppchainInfo] = useState<any>(undefined);
  const [errors, setErrors] = useState<any>({});
  const [selectedToken, setSelectedToken] = useState<any>(
    localSelectedToken ? JSON.parse(localSelectedToken) : null
  );

  const [tokenBalance, setTokenBalance] = useState('0');
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useState(false);
  const [selectedTokenContract, setSelectedTokenContract] = useState<any>();
  const [nativeToken, setNativeToken] = useState('');
  
  const [transferAmount, setTransferAmount] = useState(0);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [targetAddress, setTargetAddress]  = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [account, setAccount] = useState<string|undefined>(undefined);
  const [isRedeem, setIsRedeem] = useState(false);
  const [isAppchainInitializing, setIsAppchainIntializing] = useState(true);
  const [api, setApi] = useState<any>();

  const amountRef = useRef();

  useEffect(() => {

    if (!isRedeem) {
      setAccount(window.accountId || undefined);
    } else {
      setAccount(window.pjsAccount || undefined);
    }
  }, [isRedeem, window.pjsAccount, window.accountId]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      window.contract.get_appchain({
        appchain_id: appchain
      }),
      window.contract.get_native_token({
        appchain_id: appchain
      })
    ]).then(([info, nativeToken]) => {
      console.log(info, nativeToken);
      setAppchainInfo(info);
      setNativeToken(nativeToken);
    }).finally(() => {
      setIsLoading(false);
    });
   
  }, [appchain]);

  useEffect(() => {
    const localRedeem = window.localStorage.getItem('isRedeem') || '0';
    setIsRedeem(localRedeem === '1');
  }, []);

  useEffect(() => {
    if (!selectedToken) return;
    const contract = new Contract(
      window.walletConnection.account(),
      selectedToken.token_id,
      {
        viewMethods: ['ft_balance_of'],
        changeMethods: ['ft_transfer_call']
      }
    );

    setSelectedTokenContract(contract);
  }, [selectedToken]);

  useEffect(() => {
    let unsubscribe;
    setTokenBalance('0.00');

    if (!isRedeem) {
      if (!selectedTokenContract || !window.accountId) return;
      console.log(selectedToken);
      selectedTokenContract
        .ft_balance_of({ account_id: window.accountId })
        .then((data) => {
          console.log(data);
          setTokenBalance(fromDecimals(data, selectedToken.decimals).toFixed(2));
        });
      unsubscribe = null;
    } else {
      if (!api || !selectedToken) return;
      let assetId = tokenId2AssetId[selectedToken.token_id];
      console.log(selectedToken);
      if (assetId === undefined) {
        api.derive.balances.all([window.pjsAccount], (balance) => {
          setTokenBalance(fromDecimals(balance.freeBalance, selectedToken.decimals).toFixed(2));
        }).then(unsub => unsubscribe = unsub);
      } else {
        api.query.assets.account(assetId, window.pjsAccount, (res) => {
          const { balance } = res.toJSON();
          setTokenBalance(fromDecimals(balance, selectedToken.decimals).toFixed(2));
        }).then(unsub => unsubscribe = unsub);
      }
 
    }

    return () => unsubscribe && unsubscribe();
    
  }, [selectedToken, selectedTokenContract, isRedeem, window.accountId, window.pjsAccount, api]);

  const onSelectToken = (token) => {
    setSelectedToken(token);
    window.localStorage.setItem('selectedToken', JSON.stringify(token));
    setSelectTokenModalOpen(false);
  }

  const onLock = async () => {
    const tmpErrors = { transferAmount: !transferAmount, targetAddress: !targetAddress };
    setErrors(tmpErrors);
    if (JSON.stringify(tmpErrors).indexOf('true') > -1) {
      return;
    }

    let hexAddress = '';
    try {
      let u8a = decodeAddress(targetAddress);
      hexAddress = u8aToHex(u8a);
    } catch(err) {
      setErrors({...errors, targetAddress: true});
      enqueueSnackbar('Invalid address!', { variant: 'error' });
      return;
    }

    try {
      
      setIsSubmiting(true);
      const bridgeId = window.walletConnection._near.config.contractName;

      let amount = toDecimals(transferAmount, selectedToken.decimals);
      console.log(new BigNumber(amount).toNumber());
      try {
        if (selectedToken.token_id == nativeToken) {
          await window.contract.burn_native_token(
            {
              appchain_id: appchain,
              receiver: hexAddress,
              amount: new BigNumber(amount).toNumber()
            }, 
            BOATLOAD_OF_GAS,
            MINIMUM_DEPOSIT
          );
        } else {
          await selectedTokenContract.ft_transfer_call(
            {
              receiver_id: bridgeId,
              amount,
              msg: `lock_token,${appchain},${hexAddress}`,
            },
            BOATLOAD_OF_GAS,
            1
          );
        }
        
        setTimeout(() => {
          setIsSubmiting(false);
          enqueueSnackbar('Send transaction success!', { variant: 'success' });
        }, 1000);
      } catch(err) {
        setIsSubmiting(false);
        console.log(err);
        enqueueSnackbar(err.message, { variant: 'error' });
      }
      
    } catch (err) {
      // enqueueSnackbar('Send transaction error!', { variant: 'error' });
      console.error(err);
    }
    
    // console.log(transferAmount, targetAddress);
  }

  const onRedeem = async () => {
    const tmpErrors = { transferAmount: !transferAmount, targetAddress: !targetAddress };
    setErrors(tmpErrors);
    if (JSON.stringify(tmpErrors).indexOf('true') > -1) {
      return;
    }

    let hexAddress = stringToHex(targetAddress);

    console.log(hexAddress);

    let isNativeToken = selectedToken.token_id == nativeToken;
    let assetId;


    if (!isNativeToken) {
      assetId = tokenId2AssetId[selectedToken.token_id];
     
      if (assetId === undefined) {
        return;
      }
    }

    let amount = toDecimals(transferAmount, selectedToken.decimals);
    
    setIsSubmiting(true);

    await web3Enable('Octopus Bridge');
    const injected = await web3FromSource('polkadot-js');
    api.setSigner(injected.signer);
    await (
      isNativeToken ?
      api.tx.octopusAppchain.lock(hexAddress, amount) :
      api.tx.octopusAppchain.burnAsset(assetId, hexAddress, amount)
    ).signAndSend(account, (res) => {
        console.log(res);
        if (res.isFinalized) {
          setIsSubmiting(false);
          window.location.reload();
        } else if (res.isError) {
          setIsSubmiting(false);
          enqueueSnackbar('Transaction error!', { variant: 'error' });
          console.error(res);
        }
      }).catch(err => {
        console.error('hehe', err);
        enqueueSnackbar(err.message, { variant: 'error' });
        setIsSubmiting(false);
      });
  }

  const onTransfer = () => {
    if (!isRedeem) {
      onLock();
    } else {
      onRedeem();
    }
  }

  useEffect(() => {
    if (!appchainInfo || appchainInfo.status !== 'Booting') {
      return;
    }
    
    let provider;
    try {
      provider = new WsProvider(appchainInfo.rpc_endpoint);
      
    } catch(err) {
      console.error(err);
      return;
    }
    const api = new ApiPromise({ 
      provider, types: { 
        "AssetBalanceOf": "u128", 
        "AssetIdOf": "u32",
        "TAssetBalance": "u128" 
      } 
    });
    
    setIsAppchainIntializing(true);
    api.on('connected', () => {
      console.log('appchain connected');
    });

    api.on('ready', async () => {
      console.log('appchain ready');
      setIsAppchainIntializing(false);
      setApi(api);
    });

    api.once('error', err => {
      setIsAppchainIntializing(false);
      api.disconnect();
      setApi(undefined);
    });

  }, [appchainInfo]);
  
  const onBack = () => {
    navigate('/');
  }

  const onAccountChange = (redeem) => {
    setIsRedeem(redeem);
    window.localStorage.setItem('isRedeem', redeem ? '1' : '0');
    setAccountModalOpen(false);
  }

  const onDisconnect = () => {
    if (!isRedeem) {
      window.walletConnection.signOut();
      window.location.reload();
    } else {
      window.localStorage.removeItem('pjsAccount');
      window.pjsAccount = '';
      setAccount(undefined);
    }
  }

  return (
    <>
      <Typography color="secondary" variant="h5">Transfer asset</Typography>
      <Paper className={classes.form} elevation={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button color="default" size="small" 
            style={{ textTransform: 'none' }} 
            onClick={onBack}><ChevronLeft /> {appchain}</Button>
          
          {
            isAppchainInitializing ?
            <CircularProgress size={16} /> :
            <Polling api={api} />
          }
        </Box>
        
        <div style={{ marginTop: 20 }} />
        <form autoComplete="off">
          <ListItem>
            <Box display="flex" alignItems="center" justifyContent="space-between" style={{
              padding: '10px', background: '#f5f5f5', borderRadius: '15px', width: 'calc(100% - 20px)'
            }}>
              <Avatar src={isRedeem ? pjsLogo : nearLogo} style={{ width: 24, height: 24 }} />
              <Button onClick={() => setAccountModalOpen(true)} style={{ width: 'calc(100% - 60px)' }}>
                <div style={{ 
                  textAlign: 'left', textOverflow: 'ellipsis', textTransform: 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', width: 'calc(100% - 30px)'
                }}>{account || 'No account'}</div>
                <ExpandMore />
              </Button>
              {
                account && 
                <IconButton size="small" onClick={onDisconnect}>
                  <Close fontSize="inherit" />
                </IconButton>
              }
            </Box>
            
          </ListItem>
          <ListItem>
            <FormControl fullWidth variant="outlined" error={errors.transferAmount} required>
              <InputLabel htmlFor="transfer-amount">Amount</InputLabel>
              <OutlinedInput id="transfer-amount" placeholder="Transfer amount" autoFocus
                onChange={e => {
                  let value: any = e.target.value;
                  setTransferAmount(!isNaN(value) ? value*1 : 0);
                }}
                type="number" ref={amountRef}
                endAdornment={
                  <InputAdornment position="end">
                    <ListItem button disabled={!account}
                      onClick={() => setSelectTokenModalOpen(a => !a)} 
                      style={{ 
                        display: 'flex', flexDirection: 'column', fontSize: 14, justifyContent: 'center',
                        borderRadius: 10, padding: '0 5px', minHeight: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', lineHeight: '12px' }}>
                        { selectedToken ? selectedToken.symbol : 'Select token' } <ExpandMore />
                      </div>
                      {
                        selectedTokenContract && 
                        <Typography display="block" variant="caption" 
                          style={{ color: '#9c9c9c', lineHeight: 1.2 }}>{tokenBalance}</Typography>
                      }
                    </ListItem>
                  </InputAdornment>
                } labelWidth={65} />
            </FormControl>
          </ListItem>
          <Box alignItems="center" display="flex" justifyContent="center" height={30}>
            <ArrowDownward />
          </Box>
          <ListItem>
            <FormControl fullWidth variant="outlined" error={errors.targetAddress} required>
              <InputLabel htmlFor="destination">Destination</InputLabel>
              <OutlinedInput id="destination" placeholder={ isRedeem ? 'Near account' : `${appchain} account` }
                onChange={e => {
                  let value: any = e.target.value;
                  setTargetAddress(value);
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <Avatar src={!isRedeem ? pjsLogo : nearLogo} style={{ width: 24, height: 24 }} />
                  </InputAdornment>
                } labelWidth={90} />
            </FormControl>
          </ListItem>
        </form>
        <ListItem>
          <Button size="large" style={{ textTransform: 'none' }} 
            onClick={onTransfer}
            variant="contained" color="primary" fullWidth 
            disabled={!account || isSubmiting || !api}>
            { 
              isSubmiting ? 
              <CircularProgress size={26} /> :
              appchainInfo && appchainInfo.status == 'Booting' ?
              account ? (
                !api ? 'Appchain is not ready' : 'Transfer'
              ) : 'Please Login' :
              'Appchain isn\'t active'
            }
           
          </Button>
        </ListItem>
      </Paper>
      <SelectTokenModal open={selectTokenModalOpen} selectedToken={selectedToken} onSelectToken={onSelectToken}
        nativeToken={nativeToken} onClose={() => setSelectTokenModalOpen(a => !a)} />
      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} isRedeem={isRedeem} 
        onChange={onAccountChange} />
    </>
  );
}

export default Transfer;