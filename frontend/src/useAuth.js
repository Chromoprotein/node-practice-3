// This page is for testing client-side authentication

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('isAuthenticated') === 'true');
  const [userRole, setUserRole] = useState(sessionStorage.getItem('userRole'));
  const [loading, setLoading] = useState(isAuthenticated && false); // Added loading state

  useEffect(() => {

    // Check local storage first to reduce delay
    if (isAuthenticated === true) {
      setIsAuthenticated(true);
      if(userRole === 'admin') {
        setUserRole("admin");
      } else {
        setUserRole("Basic");
      }
      setLoading(false);
    }
    else {

      const checkAuthStatus = async () => {
        try {
          setLoading(true); // Start loading before the request
          const response = await axios.get(process.env.REACT_APP_STATUS_URI, { withCredentials: true });
          setIsAuthenticated(response.data.isAuthenticated);
          setUserRole(response.data.role);

          sessionStorage.setItem('isAuthenticated', response.data.isAuthenticated.toString());
          sessionStorage.setItem('userRole', response.data.role);
        } catch (error) {
          console.error('Error checking authentication status:', error);
          setIsAuthenticated(false);
          setUserRole(null);

          sessionStorage.setItem('isAuthenticated', 'false');
          sessionStorage.setItem('userRole', 'null');
        } finally {
          setLoading(false); // End loading after the request or on error
        }
      };

      checkAuthStatus();
    }
    
  }, [isAuthenticated, userRole]);

  return { isAuthenticated, userRole, loading };
};