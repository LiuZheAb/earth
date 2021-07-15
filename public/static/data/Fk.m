%F(x)
function F=Fk(x)
n=length(x); F=zeros(n,1);
for i=1:n-1
    F(i)=x(i)*x(i+1)-1;
end
F(n)=x(1)*x(n)-1;