import { useEffect, useState } from 'react';
import { Tooltip } from '@material-ui/core';
import styled, { keyframes } from 'styled-components';

const StyledPolling = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  color: rgb(39, 174, 96);
`;
const StyledPollingNumber = styled.div<{ breathe: boolean, hovering: boolean }>`
  transition: opacity 0.25s ease;
  opacity: ${({ breathe, hovering }) => (hovering ? 0.7 : breathe ? 1 : 0.2)};
  :hover {
    opacity: 1;
  }
`;
const StyledPollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  margin-left: 0.5rem;
  border-radius: 50%;
  position: relative;
  background-color: rgb(39, 174, 96);
`

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);
  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.green1};
  background: transparent;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
  left: -3px;
  top: -3px;
`;

const Polling = ({
  api
}: {
  api: any;
}) => {

  const [blockNumber, setBlockNumber] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const [isMounting, setIsMounting] = useState(false);

  useEffect(() => {
    if (!api) return;
    let unsubscribeAll = null;
    const bestNumber = api?.derive.chain.bestNumberFinalized;
    bestNumber && bestNumber(number => {
    
      setIsMounting(true);
      setBlockNumber(number.toNumber());
      setTimeout(() => {
        setIsMounting(false);
      }, 1000);
      
    
    }).then(unsub => {
      unsubscribeAll = unsub;
    }).catch(console.error);

    return () => {
      unsubscribeAll && unsubscribeAll();
    }
  }, [api]);

  return (
    <Tooltip title={`Best number: ${blockNumber}`}>
      <StyledPolling onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
        <StyledPollingNumber breathe={isMounting} hovering={isHover}>
          {blockNumber}
        </StyledPollingNumber>
        <StyledPollingDot>{isMounting && <Spinner />}</StyledPollingDot>
      </StyledPolling>
    </Tooltip>
  );
}

export default Polling;