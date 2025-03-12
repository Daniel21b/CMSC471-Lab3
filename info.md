Required elements

Web-based Interactive visualization
Write-ups on your webpage
Public webpage
Record a demo video
Checklist

Grading rubric

How we publicized Lab 3

Tips for success

Assignment 2: Interactive Visualization
CMSC471: Introduction to Information Visualization (Spring 2025)

Due: March 13, 2025, 11 : 59 PM EST
Group size: 2-3 students
Submission:

Webpage: Your interactive visualization and write-up.
Demo link: URL submitted to Canvas-ELMS.
Video: A brief demo video submitted to Canvas-ELMS.
Interactive visualizations do more than display data — they invite users to explore hidden stories and patterns. In this assignment, you will
act as both designer and developer, creating an interactive tool that makes data exploration intuitive, engaging, and insightful.

The goal of this assignment is to gain familiarity implementing interaction techniques for visualizations. For example, the zipdecode
(https://benfry.com/zipdecode/) and NameVoyager
(https://web.archive.org/web/20211107232302/https://www.babynamewizard.com/namevoyager-expert) applications shown in class apply
the interactive technique of dynamic queries – as explored in the earlier HomeFinder application – to the problem of uncovering patterns in
zip codes and baby names. Similarly, treemaps (https://www.cs.umd.edu/hcil/treemap/) were originally developed to display hierarchical file
structure, and were later adapted to the problem of interactively depicting a map of the stock market
(https://www.bewitched.com/marketmap.html). We have seen many examples of interactive visualization techniques in class. The goal with
this assignment is not only for you to gain hands-on implementation experience, but also for you to think about the effectiveness of the
specific techniques for your chosen data.

What youʼll do
Your task is to design and implement a web-based interactive visualization (this could be multiple smaller visualizations) for a dataset of
your choice. Aim at enabling understanding of a compelling question for a dataset of your own choosing. In order to determine what subset
of the data and which interactive options are most promising, you may want to perform additional exploratory analysis. What aspects of the
data reveal the most interesting discoveries or stories? Do not feel obligated to try to convey everything about the data: focus on a
compelling subset. Youʼll explore design questions like:

What story or insight does this dataset show?
How can users interact with the visualization to uncover that story?
Which techniques best facilitate exploration and understanding?
Which aspects of the dataset are the most compelling?
What visual encodings and interaction techniques suit your data and audience?
To get up and running quickly with this assignment, we ask you to explore one of the following provided datasets:

Chicago Crimes, 2001–present (https://data.cityofchicago.org/stories/s/Crimes-2001-to-present-Dashboard/5cd6-ry 5 g) (scroll
down, click on the three dots to download a CSV file). This dataset reflects reported incidents of crime (with the exception of murders
where data exists for each victim) that occurred in the City of Chicago from 2001 to present, minus the most recent seven days. Data
is extracted from the Chicago Police Departmentʼs CLEAR (Citizen Law Enforcement Analysis and Reporting) system. Note: you donʼt
have to show a map.
What youʼll do

Daily Weather in the U.S., 2017 (https://fumeng-yang.github.io/CMSC471/handouts/weather.csv). This dataset contains daily U.S.
weather measurements in 2017, provided by the NOAA Daily Global Historical Climatology Network. This data has been transformed:
some weather stations with only sparse measurements have been filtered out. See the accompanying weather.txt (https://fumeng-
yang.github.io/CMSC471/handouts/weather.txt) for descriptions of each column.
Social mobility in the U.S. (https://opportunityinsights.org/data/). Raj Chettyʼs group at Harvard studies the factors that contribute to
(or hinder) upward mobility in the United States (i.e., will our children earn more than we will). Their work has been extensively
featured in The New York Times (https://www.nytimes.com/search?query=raj% 20 chetty). This page lists data from all of their papers,
broken down by geographic level or by topic. We recommend downloading data in the CSV/Excel format, and encourage you to
consider joining multiple datasets from the same paper (under the same heading on the page) for a sufficiently rich exploratory
process.
Required elements
1. Web-based Interactive visualization
The goal is not to create an overwhelming visualization but a focused, elegant, and intuitive design. You will implement at least one
interaction from each category:

Catergort I: Connection/Filtering

Brushing and linking
Dynamic filters or queries (Link by tuple/query)
Catergort II: Exploration/Selection/Abstraction/Elaboration/Encoding

Panning and/or zooming.
Details-on-demand (e.g., tooltips).
Highlighting, annotation.
Other narrative features intended to draw attention to particular items of interest and provide additional context.
We expect most students will use D3.js for this assignment; however, you are free to use other web-based libraries (e.g., Vega, Plotly,
Shinny, etc). Your program should not require customized server-side support; you should simply load data from a static data file (csv, json,
etc.).

2. Write-ups on your webpage
Include a brief, clear write-up on your webpage:

A brief introduction to your dataset, background and your chosen variable(s) or subset.
Rationale for your design decisions. List your implemented interactions. Explain: How did you choose your particular visual
encodings and interaction techniques? What alternatives did you consider and how did you arrive at your ultimate choices?
References to data resources. Be sure to list the data source you used. If your work adapts or builds on existing visualization
examples, please cite those as well.
An overview of your development process. Describe how the work was split among the team members. Include a commentary on the
development process, including answers to the following questions: Roughly how much time did you spend developing your
application (in people-hours)? What aspects took the most time?
If any: A brief summary of AI (e.g. ChatGPT) usage.
3. Public webpage
Deploy your visualization on a publicly accessible webpage. There are several ways to do this—the easiest is to use GitHub to host your
project repository (see https://pages.github.com/ (https://pages.github.com/)). We also include details on how we publicized a lab at the end
of this handout.

4. Record a demo video
The main purpose of this video is to provide a timestamp for your project demo (to prevent major changes after the deadline). It doesnʼt
need to be polished or have a professional voiceover, but it should be short (a few minutes), functional, and clearly showcase the features
youʼve implemented. A casual voiceover is encouraged but not required.

Checklist
Register your team on Canvas.
Design an interactive visualization (could multiple smaller visualizations) with required interaction techniques.
Deploy your visualization on as a webpage.
Make sure your visualization has labels and captions.
Includ a brief write-up with references on your webpage.
Submit your webpage URL to Canvas-ELMS.
Submit a short demo video to Canvas-ELMS.
Team registration

Grading rubric
Your project will be evaluated on the following dimensions out of 120 points. However, missing the web URL or the video will result in
losing 50 % of the points.

Component Excellent Good Poor
Interactive design
(25%)
Includes multiple required
interactions (e.g., brushing,
zooming, panning, selecting,
highlighting) that enhance user
engagement and exploration.
Interactions are intuitive and
smooth.
Includes basic interactions that
enable exploration. Some
interactions may lack polish or
clarity.
Few or no interactive features.
Interactions are confusing or
unhelpful.
Visualization design
(25%)
Uses effective visual encodings
and thoughtful design principles.
Clearly communicates key
insights and supports user tasks.
Uses basic visual encodings with
some effectiveness. May have
minor design flaws or unclear
elements.
Poor visual encodings that hinder
understanding. Lacks coherence
or focus.
Implementation (20%) Fully functional code with robust
performance and no noticeable
bugs.
Mostly functional code with
minor issues.
Significant errors or bugs that
impair functionality.
Write-up (20%) Thorough explanation of
implemented interactions, design
decisions, data sources, and
process. Insightful reflections on
challenges and successes.
Lists implemented interactions.
Adequate explanation with minor
gaps or limited detail. Reflections
are somewhat superficial.
Incomplete or unclear
explanation. Missing details or no
reflections.
Component Excellent Good Poor
Demo video (10%) Clearly shows all implemented
features in a short, functional
recording.
Demonstrates most key features
but may have minor gaps or
unclear moments.
Incomplete, unclear, or fails to
show core functionalities.
In addition, we award up to 10 % extra credit for:

Advanced interaction techniques.
Novel visual elements or multi-view coordination.
Exceptional graphic design.
How we publicized Lab 3
We create a new, public repository (e.g., CMSC471-Lab3).
create a repository

Then clone the repository to a local folder, and copy your code into the folder. Note the index.html must be at the top level of this
folder.
CMSC471-Lab3/
├── index.html
├── css/
│ └── styles.css
├── js/
│ └── script.js
└── data/
└── data.json
clone a repository

Push your code to GitHub.
push code to GitHub

We need to set up the GitHub pages. Click on Settings and then Pages. Choose the appropriate branch (e.g., main).
Set up Github pages

Then you can assess your page at [github username].github.io/[project name] (e.g., https://fumeng-yang.github.io/CMSC471-
Lab3/ (https://fumeng-yang.github.io/CMSC471-Lab3/)). It may take up to 10 minutes (according to GitHub) or a few hours (my
experience sometimes) for the page to show up.
Visit your project page

When the page is alive, you can find a confirmation under the Pages tab.

Deployment confirmation

Deployment tips

Try a deployment early (e.g., at least a couple of days before the deadline).
You can start with a private repository, and then turn it into a public repository.
If data fails to load, check your file paths.
Tips for success
Start small: Focus on a specific story or subset of your data. A polished, simple visualization is better than a sprawling, incomplete
one.
Iterate: Test your design early and often. Share drafts with peers for feedback.
Leverage resources: Use class examples, online tutorials, and the GitLab documentation.
Plan your time: Assign roles and set deadlines within your team to stay on track.