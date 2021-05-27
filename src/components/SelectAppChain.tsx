import { useEffect, useState } from 'react';
import { 
  Box, Typography, Fade, Paper, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Divider 
} from '@material-ui/core';

import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

import { ChevronRight } from '@material-ui/icons';
import LoadingCircle from 'components/LoadingCircle';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    list: {
      marginTop: 30,
      width: '100%',
      boxShadow: 'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px',
      maxWidth: 380
    }
  }),
);

const SelectAppChain = ({
  onSelect
}: {
  onSelect: Function;
}) => {
  const classes = useStyles();
  const [isLoading, setIsLoading] = useState(false);

  const [appchainList, setAppchainList] = useState([]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const count = await window.relayContract.get_num_appchains();
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(
          window.relayContract.get_appchain({
            appchain_id: i,
          })
        );
      }
      const appchains = await Promise.all(promises);
      
      if (appchains && appchains.length) {
        setAppchainList(appchains.map(({ id, appchain_name, status }) => ({
          id, status,
          name: appchain_name.substr(0, 1).toUpperCase() + appchain_name.substr(1)
        })));
      }
      setIsLoading(false);
      
    }
    init();
  }, []);
  
  return (
    <>
      <Typography color="secondary" variant="h5">Select an appchain</Typography>
      {
        isLoading || appchainList.length <= 0 ? 
        <Box display="flex" alignItems="center" height={100} justifyContent="center">
          <LoadingCircle />
        </Box> :
        <Fade in={!!appchainList.length}>
          <Paper className={classes.list} elevation={0}>
            <List>
              {
                appchainList.map((chain, idx) => {
                  const isActive = chain.status == 'Active';
                  return (
                    <>
                    <ListItem button disabled={!isActive} onClick={() => onSelect(chain)} key={`appchain-${idx}`}>
                      <ListItemAvatar>
                        <Avatar style={{ width: 26, height: 26, background: isActive ? '#53ab90' : '' }}>{idx}</Avatar>
                      </ListItemAvatar>
                      <ListItemText>{chain.name}</ListItemText>
                      <ChevronRight />
                    </ListItem>
                    { idx != appchainList.length - 1 && <Divider /> }
                    </>
                  );
                })
              }
            </List>
          </Paper>
        </Fade>
      }
      
    </>
  );
}

export default SelectAppChain;