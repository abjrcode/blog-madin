+++
title = "Monty Hall Problem"
description = "Even after learning so much about probability, my intuition still fails me! Does yours too? Let's explore the problem once more and try to see if we can fix it!"
weight = 3
insert_anchor_links = "right"

[extra]
type = "standalone"
date = "2023-10-15"
+++

# Monty Hall Problem & Intuition

If you have spent some time studying probability, especially [conditional probability](https://en.wikipedia.org/wiki/Conditional_probability) and [Bayes' theorem](https://en.wikipedia.org/wiki/Bayes%27_theorem), you've very likely come across the Monty Hall Problem.

If not, fear nothing for this post is not really about probability theory or mathematics, but rather my attempt to document the pitfalls I fell into when trying to solve the problem, and how it finally "clicked" for me.

Perhaps you had your own pitfalls, or you're still struggling to understand the solution. If that is the case, I hope this post will help you in some way.

## The Problem Statement

The problem comes in many forms, but the most common one is the following:

> Suppose you're on a game show, and you're given the choice of three doors: Behind one door is a car; behind the others, goats. You pick a door, say No. 1, and the host, who knows what's behind the doors, opens another door, say No. 3, which has a goat. He then says to you, "Do you want to change your initial choice and open the remaining door, or would you rather stay with it?"

{{ imgcaption(src="./monty_hall_problem.jpeg", caption="The Monty Hall Problem - Courtesy of Bing AI") }}

The question is: Should you switch or not?
That is, which action of the too would maximize your chances of winning the car?

If you had never heard of this problem before, I suggest you take a moment to think through it before rushing into a final answer.

## On Failing Intuition

When I first heard of this problem, my immediate reaction was to think that it doesn't really matter whether I switch or not. It is not going to change my odds of winning. After all, _nothing has really changed after the host opened the door!_.

I was soooo wrong!

It turns out that you should always switch. You will have a 2/3 (~66%) chance of winning if you do, and only 1/3 (~33%) if you don't.

Now if your intuition failed you as well, don't worry, you are not alone in this.

When the problem was first published somewhere in the 90s, many people, including mathematicians, wrote to the author claiming that he was wrong. Many who supposedly had PhD's in mathematics. Even [Paul Erdős](https://en.wikipedia.org/wiki/Paul_Erd%C5%91s), one of the most prolific mathematicians of the 20th century, had to be shown a computer simulation before he was convinced<sup><a href="#monty_hall_background">1</a></sup>.

I was no different. Even after I saw the solution and the reasoning behind it, I was still trying to justify why and how that solution could be wrong.

## Common Explanations

There are many explanations out there that try to make the solution intuitive, here is some of the most common ones I have come across:

1. Imagine if your friend gave you a contact list with thousands of names in it then asked you to select their best friend from the list. You pick one name at random. Now, your friend eliminates all the other names except one. Would you switch or not? What are the odds that you picked the right name in your first attempt?
2. Imagine if there were 100 doors instead of 3. You pick one door at random. Now the host opens 98 doors and leaves only one door closed. Would you switch or not?

You can find many more [here](https://www.quora.com/Guys-Im-going-crazy-why-dont-I-get-the-Monty-hall-problem-why-does-the-elimination-of-one-doors-results-in-the-increase-probability-of-just-one-of-the-doors-and-not-the-other), [here](https://www.reddit.com/r/mathematics/comments/boir5e/no_matter_how_hard_i_try_i_cant_understand_the/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button) and [here](https://matheducators.stackexchange.com/q/2679)

## Stubbornness

Even after seeing these and other explanations, I was still struggling to "accept" it.

I was still thinking:

1. hey, so what? of course the host can open 98 doors, he knows where the car is and he will always be able to leave only one door closed.
2. How can my odds at winning change? I have already chose a door, how would changing my initial choice change my odds!
3. Perhaps the host is playing mind games with me!

In reality, while all of these are valid questions, they don't change the fact that switching will always give you a 2/3 chance of winning. Even if the host is playing mind games; as long as he is sticking to the rules of the game, switching will always give you better odds!

Let's try to understand why.

## What Made It Click for Me

I have to make a confession here. Even after seeing so many explanations and simulations, I was still struggling to accept the solution. I was still trying to find a way to justify why the solution was wrong.

Acceptance is hard, but that did not prevent me from attempting to seek an explanation that satisfied my curiosity, even a little bit.

As it turns out, it all boils down to the fact that the host knows where the prize (car) is. He knows which door to open and which door to leave closed. If that was not the case, then changing your initial choice _(even trillion times)_ would make absolutely no difference.

### Why does that matter so much?

Let's go through this step by step:

1. You made a choice. Let's say you picked door 1.
2. There are two possibilities:
   - You picked the door with the car behind it.
   - You picked a door with a goat behind it.
3. If you picked the door with the car behind it, then the host can open any door he wants.
   - If you stick with your initial choice, you will win.
   - If you switch, you will lose.
4. If you picked a door with a goat behind it, then the host can only open one door.
   - If you stick with your initial choice, you will lose.
   - If you switch, you will win.

Now notice, when you made your initial choice, you had 3 "equally likely" options to choose from and that meant your chances of winning (i.e. making the "right" choice) were 1 in 3 (1/3). That also meant your chances of losing were 2 in 3 (2/3)

Okay, so now, if you were to switch all the time, you would only lose in the case where you picked the door with the car behind it, but hey, that's the least likely scenario! You only had a 1/3 chance of picking the right door in the first place!

The more likely scenario is that you picked a door with a goat behind it, and in that case, switching would always win you the car, and that's where the 2/3 odds come from!

The host knowing where the car is, and by extension, knowing which door to open doesn't change our luck per sé. It just changes the "environment" in which we are playing. In a way he is eliminating another "bad" choice for us.

# Conclusion

I hope this post was helpful in some way. If you're still struggling to accept the solution, I would love to hear from you in the comments.

Explaining how you're thinking about the problem from your perspective, phrased in your own words, might help me help you eliminate the confusion.

<ol id="footnotes"> 
 <li id="monty_hall_background"><a target="_blank" href="https://en.wikipedia.org/wiki/Monty_Hall_problem
">https://en.wikipedia.org/wiki/Monty_Hall_problem
</a></li>
</ol>
