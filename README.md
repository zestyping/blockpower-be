## Introduction

This software enables a "Voting Ambassador" workflow for get-out-the-vote campaigns. The Vote Ambassador, once signed up, is provided a list of voters in their area (within some configurable number of meters from the Ambassador). This distance is calculated via the Neo4J apoc.distance function, using the Point data type either imported from CSV in the case of a Tripler, or pulled from an external API (census.gov) in the case of Ambassadors.

Once the Ambassador has "claimed" a list of Vote Triplers, the Vote Triplers can be contacted through the system, requesting confirmation that they will assist 3 people to vote. If that Vote Tripler responds in the affirmative to the SMS, the system will record a payment for the Vote Ambassador. This can take the form of Stripe or other payment method.

# Setting up

The list of Vote Triplers must of course be imported using the import script found in `/server/scripts/importer` (NOTE! CSV format, very specific column order). 

### Frontend

A Vote Ambassador signs up with and interacts mainly with the React front-end. The front-end code can be found here: [hello-voter](https://github.com/colab-coop/hello-voter). 

### Admin-ui

This software also has the concept of "admin", an Ambassador account which is empowered to block Ambassadors, make another Ambassador an admin, and download CSV data reports of Ambassadors and their claimed Triplers.

The admin panel can be found here: [https://github.com/colab-coop/HelloVoter-admin-ui](https://github.com/colab-coop/HelloVoter-admin-ui).

## Production Deployment

Note the deployment branch for the api is "ambassador", with tagged releases.

We (CoLab) are currently using an AWS cluster to deploy all of this code (api, frontend, and admin-ui). We use an Ansible playbook to provision the servers. We point the servers to a Neo4J database hosted at Graphene. The frontend is also hosted on an AWS server in the cluster, also using an Ansible playbook. We have CircleCI workflows implemented for deployment.

You are, of course, free to deploy in any way you wish, but we have not attempted any other deployment configuration so YMMV.

## License

	Software License Agreement (AGPLv3+)

	Copyright (c) 2020, Our Voice USA. All rights reserved.

        This program is free software; you can redistribute it and/or
        modify it under the terms of the GNU Affero General Public License
        as published by the Free Software Foundation; either version 3
        of the License, or (at your option) any later version.

        This program is distributed in the hope that it will be useful,
        but WITHOUT ANY WARRANTY; without even the implied warranty of
        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        GNU Affero General Public License for more details.

        You should have received a copy of the GNU Affero General Public License
        along with this program; if not, write to the Free Software
        Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.

**NOTE:** We relicense the mobile app code for the purposes of distribution on the App Store. For details, read our [CLA Rationale](CLA-Rationale.md)

Logos, icons, and other artwork depicting the Our Voice bird are copyright and not for redistribution without express written permission by Our Voice USA.
