#!/bin/bash

if [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_REPO_SLUG" == "BYU-ODH/apeworm" ] && [ "$TRAVIS_TAG" != "" ]; then
    echo "Commit made to BYU-ODH/apeworm, is not a pull request and has a tag"
fi