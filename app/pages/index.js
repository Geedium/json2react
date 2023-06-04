import React from 'react';
import Page from '../components/Page';
import Header from '../components/Header';

const Home = () => {
  return (
    <>
      <Page hello elevation={1} title="Partial working?!" style={{"backgroundColor":"#ffffff","color":"#000"}}><Header></Header></Page>
    </>
  )
};

export default Home;