const func = async (hre: any) => {
  try {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const baseballBoardGameContract = await deploy("BaseballBoardGame", {
      from: deployer,
      log: true,
    });
    console.log(baseballBoardGameContract.address);
  } catch (e) {
    console.log(e);
  }
};

export default func;
module.exports.tags = ["BaseballBoardGame"];
