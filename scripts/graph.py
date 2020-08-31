import random as r
adjlist=[]
countDistricts=739
for i in range(countDistricts):
  rcount= r.randint(3,8)
  nbrs=set()
  for j in range(rcount):
    nbr= r.randint(0,739)
    while nbr==i:
      nbr= r.randint(0,739)
    nbrs.add(nbr)
  adjlist.append(list(nbrs))
