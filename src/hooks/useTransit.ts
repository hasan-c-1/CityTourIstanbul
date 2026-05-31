import { useGameState } from '../context/GameStateContext';
import { gameConnections, gameNodes, TransitConnection } from '../constants/mockData';
import { calculateJourney, JourneyResult } from '../services/transitEngine';

export interface TravelOption {
  connection: TransitConnection;
  estimated: JourneyResult;
  toName: string;
}

export const useTransit = () => {
  const { state, travelTo, hasAbonman } = useGameState();

  // Find all connections that originate from the player's current location
  const getAvailableRoutes = (): TravelOption[] => {
    const currentLoc = state.currentLocation;
    
    // Both directions (since lines are bi-directional in Istanbul)
    return gameConnections
      .filter(conn => conn.fromId === currentLoc || conn.toId === currentLoc)
      .map(conn => {
        // Normalize connection direction relative to current position
        const normalizedConn: TransitConnection = conn.fromId === currentLoc 
          ? conn 
          : { ...conn, fromId: conn.toId, toId: conn.fromId };

        const destNode = gameNodes.find(n => n.id === normalizedConn.toId);
        const destinationName = destNode ? destNode.name : normalizedConn.toId;

        // Check if there was any ticket tap in the last 2 hours (120 minutes = 2.0 game hours)
        const hasActiveTransfer = state.lastTransferTime !== null && 
                                  (state.currentHour - state.lastTransferTime < 2.0);

        // Calculate dynamic cost, time, and stress under present scenario
        const estimated = calculateJourney(
          normalizedConn, 
          state.currentHour, 
          state.weather, 
          state.activeEvents, 
          state.skills, 
          hasActiveTransfer
        );

        return {
          connection: normalizedConn,
          estimated,
          toName: destinationName
        };
      });
  };

  const getDestinationName = (nodeId: string): string => {
    const node = gameNodes.find(n => n.id === nodeId);
    return node ? node.name : nodeId;
  };

  return {
    currentLocationName: getDestinationName(state.currentLocation),
    targetLocationName: getDestinationName(state.targetLocation),
    availableRoutes: getAvailableRoutes(),
    travelToRoute: (option: TravelOption) => {
      travelTo(option.connection, option.estimated);
    }
  };
};
