--Q1: Fetch all suppliers in a specific region
---****** Simple SELECT Queries. Evaluate the impact of metadata on simple table scans and filtering.

SELECT S_NAME, S_ADDRESS FROM Supplier WHERE S_NATIONKEY IN (SELECT N_NATIONKEY FROM Nation WHERE N_REGIONKEY = 1);

--Q2: Fetch all orders above a certain price
SELECT O_ORDERKEY, O_TOTALPRICE FROM Orders WHERE O_TOTALPRICE > 100000;

--Q3: Fetch customers and their orders in a specific nation
------******JOIN Queries. Consider table joins, where primary keys, foreign keys, and statistics affect the query plan.****** It takes time for statisticsdb

SELECT C.C_NAME, C.C_ADDRESS, O.O_ORDERKEY, O.O_TOTALPRICE FROM Customer C JOIN Orders O ON C.C_CUSTKEY = O.O_CUSTKEY WHERE C.C_NATIONKEY = 10;

--4 Fetch parts supplied by suppliers in a specific region
SELECT P.P_NAME, S.S_NAME, PS.PS_SUPPLYCOST FROM Part P JOIN Partsupp PS ON P.P_PARTKEY = PS.PS_PARTKEY JOIN Supplier S ON PS.PS_SUPPKEY = S.S_SUPPKEY JOIN Nation N ON S.S_NATIONKEY = N.N_NATIONKEY WHERE N.N_REGIONKEY = 2;

-----------------------------
---****Aggregation Queries. evaluate how statistics influence aggregation and grouping and sorting efficiently
--5 Calculate total supply cost for each part
SELECT P.P_PARTKEY, SUM(PS.PS_SUPPLYCOST) AS TOTAL_SUPPLY_COST FROM Part P JOIN Partsupp PS ON P.P_PARTKEY = PS.PS_PARTKEY GROUP BY P.P_PARTKEY;


--6 Calculate the average total price of orders per customer
SELECT O.O_CUSTKEY, AVG(O.O_TOTALPRICE) AS AVG_TOTAL_PRICE FROM Orders O GROUP BY O.O_CUSTKEY;

----------------------------------
-----*****Subquery and EXISTS Queries. Evaluate the database's ability to optimize subqueries an  EXIST.

--7 Fetch parts that have never been supplied
SELECT P.P_NAME FROM Part P WHERE NOT EXISTS (SELECT 1 FROM Partsupp PS WHERE PS.PS_PARTKEY = P.P_PARTKEY);

--8 Fetch customers who placed orders worth more than $50,000 *********** It takes lots of time. may it is better not to use it
SELECT C.C_NAME FROM Customer C WHERE EXISTS (SELECT 1 FROM Orders O WHERE O.O_CUSTKEY = C.C_CUSTKEY AND O.O_TOTALPRICE > 50000);

--------------------------------------
-------*********Complex Queries with Sorting. Evaluating the query planner's efficiency in handling Sorting
--9 Rank suppliers based on their total supply cost
SELECT S.S_NAME, SUM(PS.PS_SUPPLYCOST) AS TOTAL_SUPPLY_COST, RANK() OVER (ORDER BY SUM(PS.PS_SUPPLYCOST) DESC) AS RANK FROM Supplier S JOIN Partsupp PS ON S.S_SUPPKEY = PS.PS_SUPPKEY GROUP BY S.S_NAME;

--10 Fetch top 5 customers with the highest total order value*********** It takes lots of time. may it is better no to use it
SELECT C.C_NAME, SUM(O.O_TOTALPRICE) AS TOTAL_ORDER_VALUE FROM Customer C JOIN Orders O ON C.C_CUSTKEY = O.O_CUSTKEY GROUP BY C.C_NAME ORDER BY TOTAL_ORDER_VALUE DESC LIMIT 5;

