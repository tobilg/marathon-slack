FROM mhart/alpine-node:6

MAINTAINER tobilg@gmail.com

# Set application name
ENV APP_NAME marathon-slack

# Set application directory
ENV APP_DIR /usr/local/${APP_NAME}

# Set node env to production, so that npm install doesn't install the devDependencies
ENV NODE_ENV production

# Add application
ADD . ${APP_DIR}

# Change the workdir to the app's directory
WORKDIR ${APP_DIR}

# Setup of the application
RUN rm -rf ${APP_DIR}/node_modules && \
    mkdir -p ${APP_DIR}/logs && \
    npm set progress=false && \
    npm install --silent

CMD ["npm", "start"]