+++
title = "Swervo"
description = "Security, API Keys, ideas and dead ends"
weight = 5
insert_anchor_links = "right"

[extra]
type = "standalone"
date = "2023-12-25T00:00:00Z"
+++

I haven't written anything in a while. If there is something I enjoy more than learning things, it is applying what I have learned and building things.

I had a problem that I kept encountering in every job I had and I wanted to solve it once and for all.

## Secrets Management

We are all familiar with secrets, we use them everyday in our jobs and personal lives. They are everywhere. They are in our code, in our configuration files, in our databases, in our cloud providers, in our CI/CD pipelines. They are everywhere.

We already have a lot of tools that help us manage secrets. Things like password managers, key vaults and so on. But there is one thing that most of these tools don't do: help you _"manage"_ your secrets.

### What do I mean by that?

I worked in many regulated industries and one thing that is common across all of them is the importance of keeping secrets safe and the ability to audit who has access to them and when they were accessed.

This is not just for compliance purposes or cyber security. It is also for operational purposes. For example, you don't want _(optimally)_ to have a single person who has access to a secret. What if that person is on vacation or sick? What if that person leaves the company? What if that person is not available for some reason?

Most organizations solve this by creating a dedicated service account and then give certain people the ability to manage said account. The service account itself is used to generate API keys and other secrets that are then used by other systems or users.

For example, let's say you're using GitHub. You can create a service account and give it access to your repositories. Then you can generate an API key for that service account and use it from other systems that need access to GitHub <sup><a href="#github_apps">1</a></sup>.

## So what's the problem?

The main issue is when the time comes to change the secret. It could be for many different reasons: the secret was compromised, the secret is about to expire, you lost access to the value of the secret and you want to regenerate it so you can use it in a different system, etc.

When this happens, you need to go and update all the systems that use said secret. This is tedious and requires keeping track of all such systems. It is also error prone, and frankly, annoying.

Also, [security best practices](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html#272-rotation) advise that you should rotate your secrets on a regular basis.

## Swervo

Swervo is the tool that I built to solve this problem. It is a secrets management tool that helps you manage your secrets, but with a twist.

If all Swervo did was store your secrets, it wouldn't be that useful. Swervo's job was to handle two important use cases:

1. Rotate secrets on a schedule that I can control
2. When a secret is rotated or changed, Swervo should update all systems that use that secret.

I did this beforehand for a few systems, Postgres, AWS IAM credentials to name a few. I wanted Swervo to support all of these and more.

I also used it as an opportunity to learn Go and React. I discovered [Wails](https://wails.io/) <sup><a href="#wails">2</a></sup> along the way and published a [blog post](@/cross-wails/_index.md) _(and an [open source project](https://github.com/abjrcode/cross-wails))_ to help compile and build a [CGO](https://go.dev/blog/cgo) cross-platform application.

### Necessary Features

I had a few basic necessary features in mind when I started working on Swervo:

- It should be secure. After all, it is a secrets management tool.
- It should be local first. It should work offline and doesn't require any cloud or network access to work _(except for the systems that it manages when it does need to reach them)_.

With these in mind, I decided to use Sqlite as the database for Swervo. It is small, battle tested and has a lot of bindings for different languages.

I also decided to protect the application with a password. The password is used to control access to the application, but it is also used to encrypt anything sensitive. The encryption key is derived from the password _(read about [Key Derivation Functions](https://en.wikipedia.org/wiki/Key_derivation_function) if you are interested in the details)_ but is never stored anywhere. Even if someone gets a hold of the database, they won't be able to decrypt anything without the password.

I was so excited about this and started building non-stop. Until reality hit me.

## Dead Ends

For some reason, probably my excitement being #1, I didn't spend enough time to investigate if the idea is viable. I just assumed that it is and started building.

It turned out that most systems don't support managing their secrets via an API, probably, for a good reason.

I think mainly because it is complicated security wise. Think about it, if you can manage a secret via the API, you probably need a secret in the first place to authenticate with said API.

If the system allowed you to use one secret to generate or manage other secrets, what would stop a malicious process that gets a hold of a secret from generating more secrets and using them to access the system?

At least that is my theory. There are some systems that do allow you to do that (AWS IAM for example), but most don't.

## Conclusion

I ended up only supporting AWS Identity Center, which doesn't support refresh tokens :( so it is not that useful but I added support for saving the secrets of a given account to the AWS credentials file.

I learned a lot from this project, and I am glad I did it but the main lesson and takeaway is to always, always validate your idea before you start building it.

It sounds so obvious in hindsight, but I guess I had to learn it the hard way.

Nevertheless, I still decided to publish [Swervo as an open source project](https://github.com/abjrcode/swervo). Maybe someone will find it useful or extend it in a way I did not expect, or perhaps someone will be inspired by it and build something better.

<ol id="footnotes"> 
 <li id="github_apps">GitHub provides GitHub Apps to solve this problem and they are the right choice if you are integrating apps from 3rd party providers with your GitHub organization, but in many cases they are an overkill for simple use cases so you still need personal access tokens</li>
 <li id="wails">An Electron alternative that allows you to use Go and any frontend technology to build cross-platform desktop applications</li>
</ol>
