import React from 'react';

import { CircularProgress, CircularProgressProps } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      position: 'relative',
    },
    bottom: {
      color: 'rgba(100, 0, 0, .1)',
    },
    top: {
      color: '#53ab90',
      animationDuration: '888ms',
      position: 'absolute',
      left: 0,
    },
    circle: {
      strokeLinecap: 'round',
    },
  }),
);

const LoadingCircle: React.FC<CircularProgressProps> = (props) => {
  const classes = useStyles();
  const defaultSize = 28;

  return (
    <div className={classes.root}>
      <CircularProgress
        variant="determinate"
        className={classes.bottom}
        size={defaultSize}
        thickness={5}
        {...props}
        value={100}
      />
      <CircularProgress
        variant="indeterminate"
        disableShrink
        className={classes.top}
        classes={{
          circle: classes.circle,
        }}
        size={defaultSize}
        thickness={5}
        {...props}
      />
    </div>
  );
}

export default LoadingCircle;