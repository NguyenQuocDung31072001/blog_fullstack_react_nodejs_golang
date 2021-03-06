require("dotenv").config();
const Account = require("../model/account.model");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyTokenService,
} = require("../service/jwt_service");
const { redisClient } = require("../helpers/connections_redis");

const register = async (req, res) => {
  //username, email, password
  try {
    const validAccount = await Account.findOne({ email: req.body.email });

    if (validAccount) {
      return res
        .status(200)
        .json({ code: 501, data: { msg: "email exited!" } });
    }
    const _hash = await bcrypt.hash(req.body.password, saltRounds);

    const account = new Account({
      username: req.body.username,
      email: req.body.email,
      password: _hash,
    });

    await account.save();

    return res.status(200).json({ code: 200, msg: "register success" });
  } catch (error) {
    return res.status(200).json({ code: 500, msg: error.message });
  }
};

const login = async (req, res) => {
  //email,password
  try {
    const account = await Account.findOne({ email: req.body.email });
    if (!account) {
      return res.status(200).json({ code: 404, msg: "email invalid!" });
    }
    const hash = await bcrypt.compare(req.body.password, account.password);
    if (!hash) {
      return res.status(200).json({ code: 404, msg: "wrong password" });
    }
    const accessToken = generateAccessToken(account._id);
    const refreshToken = generateRefreshToken(account._id);
    await redisClient.set("refresh_token", refreshToken);
    //
    return res.status(200).json({
      code: 200,
      msg: "success",
      data: { ...account._doc, accessToken },
    });
  } catch (error) {
    return res.status(200).json({ code: 404, msg: error.message });
  }
};
const logout = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const refreshToken = async (req, res) => {
  console.log("refresh token !!!!!!!!!!!!!!!!")
  try {
    const refreshToken = await redisClient.get("refresh_token");
    const decodedToken = await verifyTokenService(refreshToken);

    const newAccessToken = generateAccessToken(decodedToken.id);
    const newRefreshToken = generateRefreshToken(decodedToken.id);

    req.headers["authorization"] = newAccessToken;
    redisClient.set("refresh_token", newRefreshToken);

    return res.status(200).json({
      code: 200,
      msg: "success",
      data: { newAccessToken },
    });
  } catch (error) {
    return res.status(200).json({ code: 500, msg: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
};
