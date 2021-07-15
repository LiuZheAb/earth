%F(x)Jacobi
function JF=JFk(x)
n=length(x); JF=zeros(n,n);
for i=1:n-1
    for j=1:n
        if j==i
            JF(i,j)=x(j+1);
        else if j==i+1
                JF(i,j)=x(j-1);
            else
                JF(i,j)=0;
            end
        end
    end
end
JF(n,1)=x(n); JF(n,n)=x(1);