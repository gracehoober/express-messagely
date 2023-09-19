"use strict";
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const Router = require("express").Router;

const router = new Router();

/** POST /login: {username, password} => {token} */
router.post("/login", function(req, res) {
  if (!req.body) throw new BadRequestError("Request body not found");

  if (!User.authenticate(req.body.username, req.body.password)){
    throw new UnauthorizedError("Unauthorized Access");
  }

  const payload = {username: req.body.username}
  const token = jwt.sign(payload, SECRET_KEY);

  return res.send(token);
})
//TODO: We use req.body a lot here ^^; destructure?

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

module.exports = router;
