FROM apify/actor-node-puppeteer-chrome

COPY package*.json ./

RUN npm --quiet set progress=false \
 && npm list --all || true \
 && npm install --only=prod --no-optional \
 && echo "Installed NPM packages:" \
 && npm list \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

COPY . ./
