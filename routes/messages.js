"use strict";
const { NotFoundError, UnauthorizedError, BadRequestError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
} = require("../middleware/auth");
const Message = require("../models/message");

const Router = require("express").Router;
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
//FIXME: get rid of authenticateJWT
router.get("/:id", authenticateJWT, ensureLoggedIn, async function (req, res) {
  const message = await Message.get(req.params.id);

  if (!message) throw new NotFoundError("Could not find", req.params.id);

  const currentUser = res.locals.user.username;
  if (currentUser !== message.from_user.username &&
    currentUser !== message.to_user.username) {
    throw new UnauthorizedError("Unauthorized Access");
  }

  res.json(message);

});



/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", authenticateJWT, ensureLoggedIn, async function (req, res) {
  const currentUser = res.locals.user.username;

  const { to_username, body } = req.body;
  const message = await Message.create({ from_username: currentUser, to_username, body });
  if (!message) {
    throw new BadRequestError("Message not created");
  }
  res.status(201).json(message);
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/

router.post(
  "/:id/read",
  authenticateJWT,
  ensureLoggedIn,
  async function (req, res) {
    const id = +req.params.id;

    const message = await Message.get(id);
    const currentUser = res.locals.user.username;

    if (!(message.to_user.username === currentUser)) {
      throw new UnauthorizedError("Unauthorized access");
    }
    const messageRead = await Message.markRead(id);
    res.json({ message: messageRead });
  });


module.exports = router;
