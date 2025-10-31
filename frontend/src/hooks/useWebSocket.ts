/**
 * WebSocket hook for real-time market updates
 */

import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../lib/constants';
import type { Opportunity, WebSocketMessage } from '../lib/types';

export function useWebSocket() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    try {
      const ws = new WebSocket(`${WS_URL}/api/v1/ws/market`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'market_update' && message.opportunities) {
            setOpportunities(message.opportunities);
            setLastUpdate(message.timestamp || new Date().toISOString());
          } else if (message.type === 'opportunity_alert' && message.opportunity) {
            // Handle alerts - could trigger notifications
            console.log('Opportunity alert:', message.opportunity, message.reason);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Attempt reconnection with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Reconnecting... (attempt ${reconnectAttempts.current})`);
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendConfig = (config: {
    strategy?: string;
    min_profit?: number;
    min_margin?: number;
    platform?: string;
  }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'set_config',
          ...config,
        })
      );
    }
  };

  return {
    opportunities,
    isConnected,
    lastUpdate,
    sendConfig,
  };
}

