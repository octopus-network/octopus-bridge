import React, { useEffect, useState, useCallback, useRef } from 'react';

import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MenuItem, Typography } from '@material-ui/core';
import { makeStyles, Theme, createStyles, styled } from '@material-ui/core/styles';
import { Contract } from "near-api-js";

import BaseModal from 'components/BaseModal';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
   
    tokenName: {
    },
    tokenSymbol: {
      fontSize: '16px',
      fontWeight: 500
    },
    tokenAddress: {
      fontSize: '13px',
      color: '#7c7c7c'
    }
  })
);

const tokenContractList = [
  'usdc.testnet',
];

const SelectTokenModal = ({ 
  open, 
  onClose, 
  selectedToken,
  nativeToken,
  onSelectToken 
}: {
  open: boolean;
  onClose: VoidFunction;
  selectedToken: any;
  nativeToken: string;
  onSelectToken: Function;
}) => {
  const classes = useStyles();
  const fixedListRef = useRef<FixedSizeList>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [nativeTokenInfo, setNativeTokenInfo] = useState<any>();
 
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      let nativeTokenInfo;
      if (nativeToken) {
        const nativeTokenContract: any = new Contract(
          window.walletConnection.account(),
          nativeToken,
          {
            viewMethods: ['ft_metadata'],
            changeMethods: []
          }
        );
        nativeTokenInfo = await nativeTokenContract.ft_metadata();
      }

      const promises = tokenContractList.map(id => (
        window.contract.get_bridge_token({
          token_id: id
        }))
      );
      try {
        const results = await Promise.all(promises);
        const tmpList = results.filter(res => !!res);
        setTokens(nativeTokenInfo ? [{
          token_id: nativeToken,
          symbol: nativeTokenInfo.symbol,
          decimals: nativeTokenInfo.decimals
        }].concat(tmpList) : tmpList);
      } catch(e) {
        console.log(e);
      }
      
      setIsLoading(false);
    }
    init();
  }, [nativeToken]);

  const onSelect = (token) => {
    onSelectToken(token);
  }

  const itemKey = useCallback((index, tokens) => {
    const token = tokens[index];
    return `${token.symbol}@${token.id}`;
  }, []);

  const Row = useCallback(({ data, index, style }) => {
    const token = data[index];
    const { symbol, token_id } = token;
    return (
      <MenuItem onClick={() => onSelect(token)} style={{
        ...style,
        background: token_id == selectedToken?.token_id ? '#f9f9fc' : ''
      }}>
        <div className={classes.tokenName}>
          <p className={classes.tokenSymbol}>
            {symbol}
          </p>
          <p className={classes.tokenAddress}>
            {token_id}
          </p>
        </div>
      </MenuItem>
    );
  }, [tokens, selectedToken]);

  return (
    <BaseModal open={open} onClose={onClose} title="Select Token">
      <>
      <div style={{ flex: 1, height: '320px' }}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <FixedSizeList
              height={height}
              width="100%"
              itemData={tokens}
              itemCount={tokens?.length}
              itemSize={56}
              ref={fixedListRef}
              itemKey={itemKey}
            >
              {Row}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
      </>
    </BaseModal>
  );
}

export default React.memo(SelectTokenModal);