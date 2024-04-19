const isInternetConn = async () => {
  try {
    const isConnected = await fetch("https://google.com");
    return isConnected.status === 200;
  } catch (err) {
    return false;
  }
};

module.exports = isInternetConn;
