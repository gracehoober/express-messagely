"use strict";
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const Router = require("express").Router;

const router = new Router();

/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res) {
  if (!req.body) throw new BadRequestError("Request body not found");

  const { username, password } = req.body;

  if (!(await User.authenticate(username, password))) {
    throw new UnauthorizedError("Unauthorized Access");
  }
  User.updateLoginTimestamp(username);

  const payload = { username };
  const token = jwt.sign(payload, SECRET_KEY);

  return res.json(token);//FIXME: want in an obj
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res) {
  if (!req.body) throw new BadRequestError("Request body not found");

  const newUser = await User.register(req.body);
  if(!newUser) throw new BadRequestError("Could not create user")

  const { username } = req.body;
  User.updateLoginTimestamp(username);//TODO: do not want this to be set in this case due to design preferences

  const payload = { username };
  const token = jwt.sign(payload, SECRET_KEY);

  return res.status(201).json(token); //FIXME: want in an obj
});

module.exports = router;
