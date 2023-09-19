"use strict";
const { NotFoundError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser
} = require("../middleware/auth");
const User = require("../models/user");
const Router = require("express").Router;
const router = new Router();


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name}, ...]}
 *
 **/

router.get("/", authenticateJWT, ensureLoggedIn, async function(req, res) {
  const users = await User.all();

  return res.json(users);
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get(
  "/:username",
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  async function(req, res) {
  const user = await User.get(req.params.username);

  return res.json(user);
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get(
  "/:username/to",
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  async function(req, res) {
  const messages = await User.messagesTo(req.params.username);

  return res.json(messages);
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get(
  "/:username/from",
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  async function(req, res) {
  const messages = await User.messagesFrom(req.params.username);

  return res.json(messages);
})

module.exports = router;
