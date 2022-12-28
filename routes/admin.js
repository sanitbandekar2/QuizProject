var express = require("express");
var router = express.Router();
var admin = require("../models/adminModel");
var QuizName = require("../models/quizNameModel");
var Questiondb = require("../models/qustionsModel");
var uuid = require("uuid");
const {
  authSchema,
  quizNameSchema,
  questionSchema,
} = require("../helper/validation_schema");

router.get("/", function (req, res, next) {
  return res.render("adminsignup.ejs");
});

router.post("/", function (req, res, next) {
  // console.log(req.body);
  var personInfo = req.body;

  if (
    !personInfo.email ||
    !personInfo.username ||
    !personInfo.password ||
    !personInfo.passwordConf
  ) {
    res.send();
  } else {
    if (personInfo.password == personInfo.passwordConf) {
      admin.findOne({ email: personInfo.email }, function (err, data) {
        if (!data) {
          var c;
          admin
            .findOne({}, function (err, data) {
              if (data) {
                console.log("if");
                c = data.unique_id + 1;
              } else {
                c = 1;
              }

              var newPerson = new admin({
                unique_id: c,
                email: personInfo.email,
                username: personInfo.username,
                password: personInfo.password,
                passwordConf: personInfo.passwordConf,
                isAdmin: true,
              });

              newPerson.save(function (err, Person) {
                if (err) console.log(err);
                else console.log("Success");
              });
            })
            .sort({ _id: -1 })
            .limit(1);
          res.send({ Success: "You are regestered,You can login now." });
        } else {
          res.send({ Success: "Email is already used." });
        }
      });
    } else {
      res.send({ Success: "password is not matched" });
    }
  }
});

router.get("/login", function (req, res, next) {
  return res.render("adminLogin.ejs");
});

router.post("/login", async (req, res, next) => {
  try {
    const result = await authSchema.validateAsync(req.body);
    admin.findOne({ email: result.email }, function (err, data) {
      if (data) {
        console.log(data);
        if (data.password == req.body.password) {
          //console.log("Done Login");
          req.session.adminId = { id: data.unique_id, isAdmin: data.isAdmin };
          //console.log(req.session.userId);
          res.send({ Success: "Success!" });
        } else {
          res.send({ Success: "Wrong password!" });
        }
      } else {
        res.send({ Success: "This Email Is not regestered!" });
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/create", function (req, res, next) {
  return res.render("createQuiz.ejs");
});

router.post("/create", async function (req, res, next) {
  try {
    const result = await quizNameSchema.validateAsync(req.body);
    let id = uuid.v4();

    QuizName.findOne({ quizName: result.qname }, function (err, data) {
      if (!data) {
        console.log(data);
        const newQuiz = new QuizName({
          quiz_id: id.trim(),
          quizName: result.qname,
          department: result.department,
        });
        newQuiz.save(function (err, quiz) {
          if (err) console.log(err);
          else console.log("Success");
        });
        id = "/admin/addQuestion/" + id;
        res.send({ Success: "Success!", quiz_id: id });
      } else {
        res.send({ Success: "Already created!" });
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/deleteQuizName/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (id != null || id != undefined) {
      const result = await QuizName.findByIdAndDelete(id);
      if (!result) {
        res.send({ Success: "Something wrong!" });
      } else {
        const data = await Questiondb.deleteMany({ quiz_id: result.quiz_id });
        console.log(data);
        const url = "/admin/profile";
        res.redirect(url);
      }
    }
  } catch (error) {
    next(error);
  }
});

router.get("/addQuestion/:id", function (req, res, next) {
  try {
    const id = req.params.id;
    if (id != null || id != undefined) {
      QuizName.findOne({ quiz_id: id.trim() }, function (err, data) {
        Questiondb.find({ quiz_id: id.trim() }, function (err, result) {
          if (!data) {
            res.redirect("/");
          } else {
            console.log("found");
            return res.render("addQuestion.ejs", {
              id: data.quiz_id,
              qname: data.quizName,
              depart: data.department,
              questions: result,
            });
          }
        });
      });
    }
  } catch (error) {
    next(error);
  }
});
router.get("/delete/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (id != null || id != undefined) {
      const result = await Questiondb.findByIdAndDelete(id);
      if (!result) {
        res.send({ Success: "Something wrong!" });
      } else {
        const url = "/admin/addQuestion/" + result.quiz_id;
        res.redirect(url);
      }
    }
  } catch (error) {
    next(error);
  }
});

router.post("/addQuestion", async function (req, res, next) {
  // console.log(req.body);
  try {
    const result = await questionSchema.validateAsync(req.body);
    console.log(result);

    Questiondb.findOne({ question: result.q }, function (err, data) {
      if (!data) {
        console.log(data);
        const newQuiz = new Questiondb({
          quiz_id: result.quiz_id,
          department: result.department,
          q: result.q,
          answer: result.answer,
          options: result.option,
        });
        newQuiz.save(function (err, quiz) {
          if (err) console.log(err);
          else console.log("Success");
        });
        res.send({ Success: "Success!", quiz_id: result.quiz_id });
      } else {
        res.send({ Success: "Already created!" });
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  console.log("profile", req.session.adminId);
  try {
    const { id, isAdmin } = req.session.adminId;

    if (!isAdmin) {
      res.redirect("/");
    }

    const data = await admin.findOne({ unique_id: id });
    // console.log("data");
    // console.log(data);

    const listQiz = await QuizName.find();

    if (!data) {
      res.redirect("/");
    } else {
      console.log("found");
      return res.render("adminHome.ejs", {
        name: data.username,
        email: data.email,
        quizs: listQiz,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/test", async (req, res, next) => {
  console.log("test");
  try {
    const listQiz = await QuizName.find();
    console.log(listQiz);
  } catch (error) {
    next(error);
  }
});

router.get("/logout", function (req, res, next) {
  console.log("logout");
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect("/");
      }
    });
  }
});

router.get("/forgetpass", function (req, res, next) {
  res.render("forget.ejs");
});

router.post("/forgetpass", function (req, res, next) {
  //console.log('req.body');
  //console.log(req.body);
  admin.findOne({ email: req.body.email }, function (err, data) {
    console.log(data);
    if (!data) {
      res.send({ Success: "This Email Is not regestered!" });
    } else {
      // res.send({"Success":"Success!"});
      if (req.body.password == req.body.passwordConf) {
        data.password = req.body.password;
        data.passwordConf = req.body.passwordConf;

        data.save(function (err, Person) {
          if (err) console.log(err);
          else console.log("Success");
          res.send({ Success: "Password changed!" });
        });
      } else {
        res.send({
          Success: "Password does not matched! Both Password should be same.",
        });
      }
    }
  });
});

module.exports = router;
