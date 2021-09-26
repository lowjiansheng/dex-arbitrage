FROM public.ecr.aws/lambda/nodejs:14

COPY dist package.json ${LAMBDA_TASK_ROOT}

RUN npm install -g npm@7.6.0

RUN npm install

CMD [ "./bot/app.lambdaHandler" ]
