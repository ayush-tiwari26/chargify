<h3>Frontend Pages/Components</h3>

- Map showing nearest charging stations, with economical and fastest routes displayed. (Both for destination enabled routing and without destination selected)

- Component for rating and forum for each EV station. Get the description of each EV station based on the reviews given by users.

- Report a new EV charging station, add picture and lat longs for verification. Multimodal LLM can be used to verify from pictures.

<h3>Features Implemented:</h3>

1. USP: User can select destination and will find an optimal path including EV station stops in between, taking in-account the rush at each EV station.

2. This assures user has to wait minimally and don't run out of battery.

3. User can signup/signin for basic authentication using JWT to avoid abuse of API.

4. We utilize Google Maps API and Azure OpenAI Service for this MVP.

5. User can locate nearby charging staitons.

6. Can rate report and post comments for each EV station, dynamically updating the status of EV stations.

7. Tech Stack Include
* React Native
* Node.js (Typescript & Express)
* PostgresSQL
## <details>  <summary>Team Discussions</summary>

                       
**PS:** If we have a source and destination of the user and some `n` EV stations, how do I route user through a route with multiple EV stations so he reaches destination and never run out of battery.

**Solutions:**
1. Create a Graph network with EV stations, source and destination as nodes, and edges as the distance between them. We first thought of bi-directional Dijkstra to do multi-stop routing with minimal cost.

2. But a simple breath first search proved to be more feasible. Based on this we decide the most-economical and fastest routes to the user.

3. For a source, we decide top K EV's in a given range defined by a threshold. Then recursively do this till the destination is within reach of the EV battery.
   
4. Algorithm discussed in detail.

</details>


<h3>Algorithm to Show source to Destination route while including EV stations on the route.</h3>

*The *Problem Statment* is defined as a network problem with:*

1. **Node:** Each EV station is a node, along with source and destination.

2. **Edges:** Each edge is the real time path (using google maps api) between one EV Station/Source to another EV Station/Destination.

3. **Constraints:** The vehicle shall not run out of battery, and each node (EV station) will provide additional X km or Y hrs of backup.

4. **Optimization Criteria:** We optimize for time taken between source to destination.

5. **Accounting Charging Time at Stations:** To tackle problem of time taken in charging, we split each node n into new nodes i->j where edge between new nodes account for time taken to recharge on this station (which depends on existing users here). The new node i will have all incoming connections to this EV station, and j will have all outgoing connections to other EV stations/destination.

6. Shortest path is defined as set of EV staions from Source to Destination such that.
(i). Time is shortest along this path.

(ii). Constraints in point 3 are satisfied along this path.


**Challenges faced and Solutions:**

**Q1.** How do we select EV stations to consider in Dijkstra, since considering all EV stations will not work in practicle time? (Divide and Conquer)
**Solution:** We do not take all EV staions to apply dijkstra, we consider an ecclipse (circle in code) with source and destination as two focus of this ecclipse, and consider only nodes within this ecclipse to apply dijksta.

**Q2.** Nodes in eclipse still too many & expensive to handle for Google's Distance Matrix API? (Sparcify the edges matrix)
**Solution:** We cluster the nodes based on distance, instead of considering all closeby stations in a region, we club the region and consider this region of N stations as a single station. This significantly reduces the cost of using Google's realtime traffic API (sustainable and practice).

**Q3.** Since system is not human monitored, how do we report station closed/description or new developments in station?
**Solution:** We use GPT4 to construct real time updated descriptions for each charging station. Running a cron job every 24 hours only if new comments are reported, cron job will keep status (description) of EV station updated.

**Q4.** Queue will form on EV Stations, how to inform user of estimated time in queue?
**Solution:** Other users will be connected through our servers using websockets, and keep us updated of how many user are in queue at same location of a Charging Station. A practicle wait time for each charge is assumed.

> (Potential Feature, NOT IMPLEMENTED). How to avoid abuse of charging station status?
**Solution:** Further if user claims that an EV station is not functional, they must send a picture of station which can be analyzed by LLMs combined with Lat Long information encoded with api token where the picture is taken to prove that a station is non-operational.
