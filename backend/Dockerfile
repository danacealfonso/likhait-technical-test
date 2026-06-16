# syntax = docker/dockerfile:1

# Use Ruby 3.3.7. The standard image includes the native build tools and
# MySQL development headers needed by the bundle.
ARG RUBY_VERSION=3.3.7
FROM ruby:$RUBY_VERSION

# Rails app lives here
WORKDIR /rails

# Prefer IPv4 DNS results. Some Docker Desktop networks expose IPv6 DNS
# records even when containers cannot route IPv6 traffic.
RUN echo "precedence ::ffff:0:0/96  100" >> /etc/gai.conf

# Install application gems
COPY Gemfile Gemfile.lock ./

# Configure bundler and install gems with retry logic
RUN bundle config set --local deployment 'false' && \
    bundle config set --local path 'vendor/bundle' && \
    bundle install --jobs 4 --retry 3

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile --gemfile app/ lib/

# Entrypoint prepares the database
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default
EXPOSE 3000
CMD ["rails", "server", "-b", "0.0.0.0"]
