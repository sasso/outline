// @flow
import Koa from 'koa';
import Router from 'koa-router';
import httpErrors from 'http-errors';
import { Mailer } from '../mailer';

const emailPreviews = new Koa();
const router = new Router();

router.get('/:type/:format', async ctx => {
  const previewMailer = new Mailer();
  let mailerOutput;
  previewMailer.transporter = {
    sendMail: data => (mailerOutput = data),
  };

  switch (ctx.params.type) {
    // case 'emailWithProperties':
    //   previewMailer.emailWithProperties('user@example.com', {...properties});
    //   break;
    default:
      if (Object.getOwnPropertyNames(previewMailer).includes(ctx.params.type)) {
        // $FlowIssue flow doesn't like this but we're ok with it
        previewMailer[ctx.params.type]('user@example.com');
      } else throw httpErrors.NotFound();
  }

  if (!mailerOutput) return;

  if (ctx.params.format === 'text') {
    ctx.body = mailerOutput.text;
  } else {
    ctx.body = mailerOutput.html;
  }
});

emailPreviews.use(router.routes());

export default emailPreviews;
