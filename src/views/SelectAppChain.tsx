import { useEffect, useState } from 'react';
import { 
  Box, Typography, Fade, Paper, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Divider 
} from '@material-ui/core';

import { useNavigate } from 'react-router-dom';
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

const SelectAppChain = () => {
  const classes = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [appchainList, setAppchainList] = useState([]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const appchains = await window.contract.get_appchains({
        from_index: 0,
        limit: 20
      });

      if (appchains && appchains.length) {
        setAppchainList(appchains.map(({ id, status }, idx) => ({
          status, id
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
                appchainList.map((appchain, idx) => {
                  const isActive = appchain.status == 'Booting';
                  return (
                    <div key={`appchain-${idx}`}>
                    <ListItem button disabled={!isActive} onClick={() => navigate(`/${appchain.id}`)}>
                      <ListItemAvatar>
                        <Avatar style={{ width: 32, height: 32, background: isActive ? '#53ab90' : '' }}>
                          {appchain.id.substr(0,1).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText>{appchain.id}</ListItemText>
                      <ChevronRight />
                    </ListItem>
                    { idx != appchainList.length - 1 && <Divider /> }
                    </div>
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