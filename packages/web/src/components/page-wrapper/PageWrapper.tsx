import React from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '../navbar/Navbar';

interface Props {
  children: JSX.Element;
  title?: string;
}

const PageWrapper = (props: Props): JSX.Element => {
  const { children, title } = props;

  return (
    <>
      <Helmet>
        <title>{title ? `${title} | Baseline Core` : 'Baseline Core'}</title>
      </Helmet>
      <Navbar />
      {children}
    </>
  );
};

export default PageWrapper;
