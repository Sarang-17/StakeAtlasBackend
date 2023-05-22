const nodemailer = require('nodemailer');
require('dotenv').config();
const Otp = require('../models/otp.model');
const logger = require('./winston');

const mailauth = async (mail) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  let otp = await Math.floor(Math.random() * 10000);
  if (otp < 1000) {
    otp = otp + 1000;
  }

  const newOtp = new Otp({
    otp,
    email: mail,
    expireAt: 1,
  });

  await newOtp.save();

  await transporter
    .sendMail({
      from: 'StakeAtlas Account verification <no-reply@stakeatlas.com>', // sender address
      to: mail, // list of receivers
      subject: 'StakeAtlas Account verification', // Subject line
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
            <html
              lang="en"
              xmlns="http://www.w3.org/1999/xhtml"
              xmlns:v="urn:schemas-microsoft-com:vml"
              xmlns:o="urn:schemas-microsoft-com:office:office"
            >
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="x-apple-disable-message-reformatting" />
                <meta
                  name="format-detection"
                  content="telephone=no,address=no,email=no,date=no,url=no"
                />
                <title>StakeAtlas</title>
                <link
                  href="https://fonts.googleapis.com/css?family=Montserrat:700&display=swap&subset=cyrillic"
                  rel="stylesheet"
                />
                <link
                  href="https://fonts.googleapis.com/css?family=Montserrat:600&display=swap&subset=cyrillic"
                  rel="stylesheet"
                />
                <!--[if mso]>
                  <style>
                    * {
                      font-family: sans-serif !important;
                    }
                  </style>
                <![endif]-->
                <!--[if !mso]><!-->
                <!-- <![endif]-->
                <style>
                  html {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
            
                  * {
                    -ms-text-size-adjust: 100%;
                    -webkit-text-size-adjust: 100%;
                  }
            
                  td {
                    vertical-align: top;
                    mso-table-lspace: 0pt !important;
                    mso-table-rspace: 0pt !important;
                  }
            
                  a {
                    text-decoration: none;
                  }
            
                  img {
                    -ms-interpolation-mode: bicubic;
                  }
            
                  @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                    u ~ div .email-container {
                      min-width: 320px !important;
                    }
                  }
            
                  @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                    u ~ div .email-container {
                      min-width: 375px !important;
                    }
                  }
            
                  @media only screen and (min-device-width: 414px) {
                    u ~ div .email-container {
                      min-width: 414px !important;
                    }
                  }
                </style>
                <!--[if gte mso 9]>
                  <xml>
                    <o:OfficeDocumentSettings>
                      <o:AllowPNG />
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                  </xml>
                <![endif]-->
                <style>
                  @media only screen and (max-device-width: 599px),
                    only screen and (max-width: 599px) {
                    .eh {
                      height: auto !important;
                    }
            
                    .desktop {
                      display: none !important;
                      height: 0 !important;
                      margin: 0 !important;
                      max-height: 0 !important;
                      overflow: hidden !important;
                      padding: 0 !important;
                      visibility: hidden !important;
                      width: 0 !important;
                    }
            
                    .mobile {
                      display: block !important;
                      width: auto !important;
                      height: auto !important;
                      float: none !important;
                    }
            
                    .email-container {
                      width: 100% !important;
                      margin: auto !important;
                    }
            
                    .stack-column,
                    .stack-column-center {
                      display: block !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      direction: ltr !important;
                    }
            
                    .stack-column-center {
                      text-align: center !important;
                    }
            
                    .center-on-narrow {
                      text-align: center !important;
                      display: block !important;
                      margin-left: auto !important;
                      margin-right: auto !important;
                      float: none !important;
                    }
                    table.center-on-narrow {
                      display: inline-block !important;
                    }
                  }
                </style>
              </head>
            
              <body
                width="100%"
                style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly"
              >
                <div style="background-color: #e5e5e5">
                  <!--[if gte mso 9]>
                    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                      <v:fill type="tile" color="#e5e5e5" />
                    </v:background>
                  <![endif]-->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td
                        style="
                          background-color: #e5e5e5;
                          border-collapse: separate !important;
                        "
                        valign="top"
                        align="center"
                      >
                        <table
                          bgcolor="#ffffff"
                          style="margin: 0 auto"
                          align="center"
                          id="brick_container"
                          cellspacing="0"
                          cellpadding="0"
                          border="0"
                          width="600"
                          class="email-container"
                        >
                          <tr>
                            <td>
                              <table
                                width="100%"
                                align="center"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                              >
                                <tr>
                                  <td width="600" bgcolor="#2a1c40">
                                    <table
                                      cellspacing="0"
                                      cellpadding="0"
                                      border="0"
                                      width="100%"
                                    >
                                      <tr>
                                        <td>
                                          <div
                                            style="
                                              height: 16px;
                                              line-height: 16px;
                                              font-size: 16px;
                                            "
                                          >
                                            &nbsp;
                                          </div>
                                          <table
                                            width="100%"
                                            cellspacing="0"
                                            cellpadding="0"
                                            border="0"
                                          >
                                            <tr>
                                              <td>
                                                <table
                                                  align="center"
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  border="0"
                                                >
                                                  <tr>
                                                    <td
                                                      style="
                                                        padding-left: 16px;
                                                        padding-right: 16px;
                                                      "
                                                    >
                                                      <img
                                                        src="https://klutchh.in/waitlist-mail/J0mVgBz2rRrDlq9TKkfNJE01NGEv0i.png"
                                                        width="568"
                                                        alt=""
                                                        border="0"
                                                        style="
                                                          width: 100%;
                                                          height: auto;
                                                          margin: auto;
                                                          display: block;
                                                        "
                                                      />
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                          <div
                                            style="
                                              height: 16px;
                                              line-height: 16px;
                                              font-size: 16px;
                                            "
                                          >
                                            &nbsp;
                                          </div>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <table
                                width="100%"
                                align="center"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                              >
                                <tr>
                                  <td width="600" bgcolor="#fffefa">
                                    <table
                                      cellspacing="0"
                                      cellpadding="0"
                                      border="0"
                                      width="100%"
                                    >
                                      <tr>
                                        <td style="padding-left: 16px; padding-right: 16px">
                                          <table
                                            width="100%"
                                            align="center"
                                            cellspacing="0"
                                            cellpadding="0"
                                            border="0"
                                          >
                                            <tr>
                                              <td
                                                width="568"
                                                style="border-collapse: separate !important"
                                              >
                                                <table
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  border="0"
                                                  width="100%"
                                                >
                                                  <tr>
                                                    <td>
                                                      <div
                                                        style="
                                                          height: -2px;
                                                          line-height: -2px;
                                                          font-size: -2px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <table
                                                        align="center"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                      >
                                                        <tr>
                                                          <td
                                                            width="40"
                                                            style="
                                                              border-collapse: separate !important;
                                                              border-radius: 3px;
                                                            "
                                                          >
                                                            <div
                                                              style="
                                                                height: 17px;
                                                                line-height: 17px;
                                                              "
                                                            >
                                                              &nbsp;
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <table
                                width="100%"
                                align="center"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                              >
                                <tr>
                                  <td width="600" bgcolor="#fffefa">
                                    <table
                                      cellspacing="0"
                                      cellpadding="0"
                                      border="0"
                                      width="100%"
                                    >
                                      <tr>
                                        <td>
                                          <div
                                            style="
                                              height: -43px;
                                              line-height: -43px;
                                              font-size: -43px;
                                            "
                                          >
                                            &nbsp;
                                          </div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="padding-left: 16px; padding-right: 16px">
                                          <table
                                            width="100%"
                                            align="center"
                                            cellspacing="0"
                                            cellpadding="0"
                                            border="0"
                                          >
                                            <tr>
                                              <td width="568" bgcolor="#2a1c40">
                                                <table
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  border="0"
                                                  width="100%"
                                                >
                                                  <tr>
                                                    <td>
                                                      <div
                                                        class="eh"
                                                        style="
                                                          height: 114px;
                                                          line-height: 114px;
                                                          font-size: 114px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                      <table
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                        width="100%"
                                                      >
                                                        <tr>
                                                          <td
                                                            class="eh"
                                                            style="
                                                              text-align: center;
                                                              height: 75px;
                                                            "
                                                          >
                                                            <div
                                                              style="line-height: normal"
                                                            >
                                                              <span
                                                                style="
                                                                  color: #ffffff;
                                                                  letter-spacing: 0.5px;
                                                                  font-family: Montserrat,
                                                                    Helvetica, Arial,
                                                                    sans-serif;
                                                                  font-size: 40px;
                                                                  text-align: center;
                                                                  font-weight: 700;
                                                                "
                                                                >${otp}</span
                                                              >
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                      <div
                                                        class="eh"
                                                        style="
                                                          height: 114px;
                                                          line-height: 114px;
                                                          font-size: 114px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <table
                                width="100%"
                                align="center"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                              >
                                <tr>
                                  <td width="600" bgcolor="#fffefa">
                                    <table
                                      cellspacing="0"
                                      cellpadding="0"
                                      border="0"
                                      width="100%"
                                    >
                                      <tr>
                                        <td>
                                          <div
                                            style="
                                              height: 50px;
                                              line-height: 50px;
                                              font-size: 50px;
                                            "
                                          >
                                            &nbsp;
                                          </div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>
                                          <table
                                            align="center"
                                            cellspacing="0"
                                            cellpadding="0"
                                            border="0"
                                          >
                                            <tr>
                                              <td
                                                width="533"
                                                style="border-collapse: separate !important"
                                              >
                                                <table
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  border="0"
                                                  width="100%"
                                                >
                                                  <tr>
                                                    <td>
                                                      <table
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                        width="100%"
                                                      >
                                                        <tr>
                                                          <td style="text-align: center">
                                                            <div style="line-height: 114%">
                                                              <span
                                                                style="
                                                                  color: #38343d;
                                                                  line-height: 114%;
                                                                  font-family: Montserrat,
                                                                    Helvetica, Arial,
                                                                    sans-serif;
                                                                  font-size: 26px;
                                                                  text-align: center;
                                                                  font-weight: 600;
                                                                "
                                                                >Enter the verification code
                                                                above to verify your
                                                                account.</span
                                                              >
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <div
                                                        style="
                                                          height: 8px;
                                                          line-height: 8px;
                                                          font-size: 8px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <table
                                                        width="100%"
                                                        align="center"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                      >
                                                        <tr>
                                                          <td width="533" bgcolor="#ffffff">
                                                            <div
                                                              style="
                                                                height: 4px;
                                                                line-height: 4px;
                                                              "
                                                            >
                                                              &nbsp;
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <div
                                                        style="
                                                          height: 8px;
                                                          line-height: 8px;
                                                          font-size: 8px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                      <table
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                        width="100%"
                                                      >
                                                        <tr>
                                                          <td style="text-align: center">
                                                            <div style="line-height: 150%">
                                                              <span
                                                                style="
                                                                  color: #38343d;
                                                                  line-height: 150%;
                                                                  font-family: Montserrat,
                                                                    Helvetica, Arial,
                                                                    sans-serif;
                                                                  font-size: 16px;
                                                                  text-align: center;
                                                                  font-weight: 700;
                                                                "
                                                                >KLUTCHH or KICK</span
                                                              >
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <div
                                                        style="
                                                          height: 8px;
                                                          line-height: 8px;
                                                          font-size: 8px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <table
                                                        width="100%"
                                                        align="center"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                      >
                                                        <tr>
                                                          <td width="533" bgcolor="#ffffff">
                                                            <div
                                                              style="
                                                                height: 20px;
                                                                line-height: 20px;
                                                              "
                                                            >
                                                              &nbsp;
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <div
                                                        style="
                                                          height: 8px;
                                                          line-height: 8px;
                                                          font-size: 8px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <table
                                                        align="center"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                      >
                                                        <tr>
                                                          <td
                                                            width="165"
                                                            bgcolor="#2a1c40"
                                                            style="border-radius: 60px"
                                                          >
                                                            <table
                                                              cellspacing="0"
                                                              cellpadding="0"
                                                              border="0"
                                                              width="100%"
                                                            >
                                                              <tr>
                                                                <td>
                                                                  <div
                                                                    style="
                                                                      height: 12px;
                                                                      line-height: 12px;
                                                                      font-size: 12px;
                                                                    "
                                                                  >
                                                                    &nbsp;
                                                                  </div>
                                                                  <table
                                                                    cellspacing="0"
                                                                    cellpadding="0"
                                                                    border="0"
                                                                    width="100%"
                                                                  >
                                                                    <tr>
                                                                      <td
                                                                        onclick="window.open('https://klutchh.in')"
                                                                        style="
                                                                          text-align: center;
                                                                          cursor: pointer;
                                                                        "
                                                                      >
                                                                        <div
                                                                          style="
                                                                            line-height: normal;
                                                                          "
                                                                        >
                                                                          <span
                                                                            style="
                                                                              color: #fffefa;
                                                                              letter-spacing: 0.5px;
                                                                              font-family: Montserrat,
                                                                                Helvetica,
                                                                                Arial,
                                                                                sans-serif;
                                                                              font-size: 14px;
                                                                              text-align: center;
                                                                              font-weight: 600;
                                                                            "
                                                                            >www.klutchh.in</span
                                                                          >
                                                                        </div>
                                                                      </td>
                                                                    </tr>
                                                                  </table>
                                                                  <div
                                                                    style="
                                                                      height: 12px;
                                                                      line-height: 12px;
                                                                      font-size: 12px;
                                                                    "
                                                                  >
                                                                    &nbsp;
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <div
                                                        style="
                                                          height: 55px;
                                                          line-height: 55px;
                                                          font-size: 55px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <table
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                              >
                                <tr>
                                  <td>
                                    <table
                                      align="center"
                                      cellspacing="0"
                                      cellpadding="0"
                                      border="0"
                                    >
                                      <tr>
                                        <td>
                                          <img
                                            src="https://klutchh.in/waitlist-mail/0e12981ca66d52a8897018b61030a837536dcce3.png"
                                            width="600"
                                            alt=""
                                            border="0"
                                            style="
                                              border-radius: 0px;
                                              max-width: 600px;
                                              height: auto;
                                              margin: auto;
                                              display: block;
                                            "
                                          />
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <table
                                width="100%"
                                align="center"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                              >
                                <tr>
                                  <td width="600" bgcolor="#2a1c40">
                                    <table
                                      cellspacing="0"
                                      cellpadding="0"
                                      border="0"
                                      width="100%"
                                    >
                                      <tr>
                                        <td style="padding-left: 8px; padding-right: 16px">
                                          <table
                                            width="100%"
                                            align="center"
                                            cellspacing="0"
                                            cellpadding="0"
                                            border="0"
                                          >
                                            <tr>
                                              <td
                                                width="508.19293212890625"
                                                style="border-collapse: separate !important"
                                              >
                                                <table
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  border="0"
                                                  width="100%"
                                                >
                                                  <tr>
                                                    <td>
                                                      <div
                                                        style="
                                                          height: 20px;
                                                          line-height: 20px;
                                                          font-size: 20px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td
                                                      style="
                                                        padding-right: 12px;
                                                        width: 136px;
                                                      "
                                                    >
                                                      <table
                                                        align="right"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                      >
                                                        <tr>
                                                          <td
                                                            width="136"
                                                            style="
                                                              border-collapse: separate !important;
                                                            "
                                                          >
                                                            <table
                                                              cellspacing="0"
                                                              cellpadding="0"
                                                              border="0"
                                                              width="100%"
                                                            >
                                                              <tr>
                                                                <td width="22">
                                                                  <table
                                                                    width="100%"
                                                                    cellspacing="0"
                                                                    cellpadding="0"
                                                                    border="0"
                                                                  >
                                                                    <tr>
                                                                      <td>
                                                                        <table
                                                                          align="left"
                                                                          cellspacing="0"
                                                                          cellpadding="0"
                                                                          border="0"
                                                                        >
                                                                          <tr>
                                                                            <td
                                                                              onclick="window.open('https://instagram.com/klutchh.in')"
                                                                            >
                                                                              <!-- <img
                                                                                src="https://klutchh.in/waitlist-mail/9B4g7E6Od4SVu0PsCSnVtAg3xbf2WJ.png"
                                                                                width="22"
                                                                                alt=""
                                                                                border="0"
                                                                                style="
                                                                                  max-width: 22px;
                                                                                  height: auto;
                                                                                  margin: auto;
                                                                                  display: block;
                                                                                "
                                                                              /> -->
                                                                            </td>
                                                                          </tr>
                                                                        </table>
                                                                      </td>
                                                                    </tr>
                                                                  </table>
                                                                </td>
                                                                <td width="22">
                                                                  <table
                                                                    width="100%"
                                                                    cellspacing="0"
                                                                    cellpadding="0"
                                                                    border="0"
                                                                  >
                                                                    <tr>
                                                                      <td>
                                                                        <table
                                                                          align="left"
                                                                          cellspacing="0"
                                                                          cellpadding="0"
                                                                          border="0"
                                                                        >
                                                                          <tr>
                                                                            <td
                                                                              style="
                                                                                padding-left: 16px;
                                                                              "
                                                                            >
                                                                              <!-- <img
                                                                                src="https://klutchh.in/waitlist-mail/awAzjIU73Zj6xvhnwp2q1rLseeWS5P.png"
                                                                                width="22"
                                                                                alt=""
                                                                                border="0"
                                                                                style="
                                                                                  max-width: 22px;
                                                                                  height: auto;
                                                                                  margin: auto;
                                                                                  display: block;
                                                                                "
                                                                              /> -->
                                                                            </td>
                                                                          </tr>
                                                                        </table>
                                                                      </td>
                                                                    </tr>
                                                                  </table>
                                                                </td>
                                                                <td width="22">
                                                                  <table
                                                                    width="100%"
                                                                    cellspacing="0"
                                                                    cellpadding="0"
                                                                    border="0"
                                                                  >
                                                                    <tr>
                                                                      <td>
                                                                        <table
                                                                          align="left"
                                                                          cellspacing="0"
                                                                          cellpadding="0"
                                                                          border="0"
                                                                        >
                                                                          <tr>
                                                                            <td
                                                                              style="
                                                                                padding-left: 16px;
                                                                              "
                                                                            >
                                                                              <!-- <img
                                                                                src="https://klutchh.in/waitlist-mail/6IF7MVIguemeN6cklRpyIqXUUby0Yf.png"
                                                                                width="22"
                                                                                alt=""
                                                                                border="0"
                                                                                style="
                                                                                  max-width: 22px;
                                                                                  height: auto;
                                                                                  margin: auto;
                                                                                  display: block;
                                                                                "
                                                                              /> -->
                                                                            </td>
                                                                          </tr>
                                                                        </table>
                                                                      </td>
                                                                    </tr>
                                                                  </table>
                                                                </td>
                                                                <td width="22">
                                                                  <table
                                                                    width="100%"
                                                                    cellspacing="0"
                                                                    cellpadding="0"
                                                                    border="0"
                                                                  >
                                                                    <tr>
                                                                      <td>
                                                                        <table
                                                                          align="left"
                                                                          cellspacing="0"
                                                                          cellpadding="0"
                                                                          border="0"
                                                                        >
                                                                          <tr>
                                                                            <td
                                                                              onclick="window.open('https://instagram.com/klutchh.in')"
                                                                            >
                                                                              <img
                                                                                src="https://klutchh.in/waitlist-mail/9B4g7E6Od4SVu0PsCSnVtAg3xbf2WJ.png"
                                                                                width="22"
                                                                                alt=""
                                                                                border="0"
                                                                                style="
                                                                                  max-width: 22px;
                                                                                  height: auto;
                                                                                  margin: auto;
                                                                                  display: block;
                                                                                "
                                                                              />
                                                                            </td>
                                                                          </tr>
                                                                        </table>
                                                                      </td>
                                                                    </tr>
                                                                  </table>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <div
                                                        style="
                                                          height: 12px;
                                                          line-height: 12px;
                                                          font-size: 12px;
                                                        "
                                                      >
                                                        &nbsp;
                                                      </div>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div style="height: 0px; line-height: 0px; font-size: 0px">
                                &nbsp;
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
              </body>
            </html>
            `,
    })
    .catch((err) => {
      logger.error('Error sending mail: ', err);
      return err.message;
    });
};

module.exports = mailauth;
