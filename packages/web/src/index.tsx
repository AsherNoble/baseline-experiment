import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './index.scss';
import './styles/fonts.scss';
import App from './App';

Amplify.configure({
  Auth: {
    Cognito: {
      signUpVerificationMethod: 'code',
      identityPoolId: `${process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID}`,
      userPoolId: `${process.env.REACT_APP_COGNITO_USER_POOL_ID}`,
      userPoolClientId: `${process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID}`,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  </React.StrictMode>,
);
