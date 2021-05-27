import { useEffect, useState } from 'react';
import { Contract } from 'near-api-js';

import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { useSnackbar } from 'notistack';

import BigNumber from 'bignumber.js';

import { 
  Box, Typography, ListItem, FormControl, Paper, 
  InputLabel, OutlinedInput, InputAdornment, Button, CircularProgress 
} from '@material-ui/core';

import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { fromDecimals, toDecimals } from 'utils';
import { ArrowBack, ArrowDownward, ChevronLeft, ExpandMore } from '@material-ui/icons';
import SelectTokenModal from './SelectTokenModal';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    form: {
      boxShadow: 'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px',
      marginTop: 30,
      width: '100%',
      maxWidth: 360,
      boxSizing: 'border-box',
      padding: 20
    }
  }),
);

const tokenContractList = [
  'test-stable.testnet'
];

const BOATLOAD_OF_GAS = new BigNumber(3).times(10 ** 14).toFixed();

const Transfer = ({
  appchain,
  onBack,
}: {
  appchain: any;
  onBack: Function;
}) => {
  const classes = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [selectedToken, setSelectedToken] = useState<any>();
  const [tokenBalance, setTokenBalance] = useState('0');
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useState(false);
  const [selectedTokenContract, setSelectedTokenContract] = useState<any>();
  const [tokenList, setTokenList] = useState<any[]>();
  const [transferAmount, setTransferAmount] = useState(0);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [targetAddress, setTargetAddress]  = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const promises = tokenContractList.map(id => (
        window.relayContract.get_bridge_token({
          token_id: id
        }))
      );
      const results = await Promise.all(promises);
      // if (results.length) {
      //   setSelectedToken(results[0]);
      // }
      setIsLoading(false);
      setTokenList(results);
    }
    init();
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
    if (!selectedTokenContract || !window.accountId) return;
    selectedTokenContract
      .ft_balance_of({ account_id: window.accountId })
      .then((data) => {
        setTokenBalance(fromDecimals(data, selectedToken.decimals).toFixed(2));
      });
  }, [selectedToken, selectedTokenContract, window.accountId]);
  
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
    init();
  }, []);

  const onSelectToken = (token) => {
    setSelectedToken(token);
    setSelectTokenModalOpen(false);
  }

  const onTransfer = async () => {
    const tmpErrors = { transferAmount: !transferAmount, targetAddress: !targetAddress };
    setErrors(tmpErrors);
    if (JSON.stringify(tmpErrors).indexOf('true') > -1) {
      return;
    }

    let hexAddress = '';
    try {
      console.log(targetAddress);
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
      await selectedTokenContract.ft_transfer_call(
        {
          receiver_id: bridgeId,
          amount,
          msg: `lock_token,${appchain.id},${hexAddress}`,
        },
        BOATLOAD_OF_GAS,
        1
      );

      setTimeout(() => {
        setIsSubmiting(false);
        enqueueSnackbar('Send transaction success!', { variant: 'success' });
      }, 1000);
    } catch (err) {
      // enqueueSnackbar('Send transaction error!', { variant: 'error' });
      console.error(err);
    }
    
    // console.log(transferAmount, targetAddress);
  }

  return (
    <>
      <Typography color="secondary" variant="h5">Transfer assets</Typography>
      <Paper className={classes.form} elevation={0}>
        <Button color="default" size="small" 
          style={{ textTransform: 'none' }} onClick={() => onBack()}><ChevronLeft /> {appchain?.name}</Button>
        <div style={{ marginTop: 20 }} />
        <form autoComplete="off">
          <ListItem>
            <FormControl fullWidth variant="outlined" error={errors.transferAmount} required>
              <InputLabel htmlFor="trasfer-amount">Amount</InputLabel>
              <OutlinedInput id="trasfer-amount" placeholder="Transfer amount" autoFocus 
                onChange={e => {
                  let value: any = e.target.value;
                  setTransferAmount(!isNaN(value) ? value*1 : 0);
                }}
                type="number"
                endAdornment={
                  <InputAdornment position="end">
                    <ListItem button 
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
            <FormControl fullWidth variant="outlined" required>
              <InputLabel htmlFor="trasfer-target-address">Address</InputLabel>
              <OutlinedInput id="trasfer-target-address" placeholder="Target address" 
                error={errors.targetAddress}
                onChange={e => setTargetAddress(e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    @{appchain?.name}
                  </InputAdornment>
                } labelWidth={65} />
            </FormControl>
          </ListItem>
          <ListItem>
            <Button size="large" style={{ textTransform: 'none' }} onClick={onTransfer}
              variant="contained" color="primary" fullWidth 
              disabled={!window.accountId || !selectedTokenContract || isSubmiting}>
              { isSubmiting && <CircularProgress size={18} /> }
              { window.accountId ? 'Transfer' : 'Connect to wallet' }
            </Button>
          </ListItem>
        </form>
      </Paper>
      <SelectTokenModal open={selectTokenModalOpen} tokens={tokenList} selectedToken={selectedToken}
        onClose={() => setSelectTokenModalOpen(a => !a)} onSelectToken={onSelectToken} />
    </>
  );
}

export default Transfer;