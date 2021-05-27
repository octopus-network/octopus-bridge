import { ReactElement } from 'react';
import { makeStyles, Theme, createStyles, styled } from '@material-ui/core/styles';
import { Fade, Modal, Backdrop, IconButton } from '@material-ui/core';

import { Close } from '@material-ui/icons';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    box: {
      borderRadius: '20px',
      boxShadow: 'rgb(47 128 237 / 5%) 0px 4px 8px 0px',
      background: '#fff',
      width: '380px',
      maxWidth: '86vw',
      position: 'relative'
    },
    closeButton: {
      position: 'absolute',
      right: 0,
      top: 0
    },
    boxHeader: {
      padding: '1rem',
      color: theme.palette.secondary.main,
      fontWeight: 500,
      fontSize: '16px',
      position: 'relative'
    },
    boxContent: {
      padding: '12px'
    }
  }),
);

const BaseModal = ({
  open, 
  onClose, 
  children, 
  title, 
  width
}: {
  children: ReactElement;
  open: boolean;
  onClose?: VoidFunction;
  title?: string | ReactElement;
  width?: number;
}) => {
  const classes = useStyles();
  
  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
      open={open}
      onClose={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Fade in={open}>
        <div className={classes.box} style={ width ? { width: width + 'px' } : {} }>
          {
            title &&
            <div className={classes.boxHeader}>
              <span>{title}</span>
            </div>
          }
          <IconButton className={classes.closeButton} onClick={onClose}><Close /></IconButton>
          <div className={classes.boxContent}>
            { children }
          </div>
        </div>
      </Fade>
    </Modal>
  );
}

export default BaseModal;