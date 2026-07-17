package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
public abstract class AbstractFacade<T> {

    @PersistenceContext(unitName = "turniejrejestratorPU")
    private EntityManager em;

    protected EntityManager getEntityManager() {
        return em;
    }

    private Class<T> entityClass;

    public AbstractFacade(Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    public void create(T entity) {
        getEntityManager().persist(entity);
    }

    public void edit(T entity) {
        getEntityManager().merge(entity);
    }

    public void remove(T entity) {
        getEntityManager().remove(getEntityManager().merge(entity));
    }

    public T find(Object id) {
        return getEntityManager().find(entityClass, id);
    }

    public List<T> findAll() {
        jakarta.persistence.criteria.CriteriaQuery cq = getEntityManager().getCriteriaBuilder().createQuery();
        cq.select(cq.from(entityClass));
        return getEntityManager().createQuery(cq).getResultList();
    }

    public List<T> findRange(int[] range) {
        jakarta.persistence.criteria.CriteriaQuery cq = getEntityManager().getCriteriaBuilder().createQuery();
        cq.select(cq.from(entityClass));
        jakarta.persistence.Query q = getEntityManager().createQuery(cq);
        q.setMaxResults(range[1] - range[0] + 1);
        q.setFirstResult(range[0]);
        return q.getResultList();
    }

    public int count() {
        jakarta.persistence.criteria.CriteriaQuery cq = getEntityManager().getCriteriaBuilder().createQuery();
        jakarta.persistence.criteria.Root<T> rt = cq.from(entityClass);
        cq.select(getEntityManager().getCriteriaBuilder().count(rt));
        jakarta.persistence.Query q = getEntityManager().createQuery(cq);
        return ((Long) q.getSingleResult()).intValue();
    }

    public long countByActive() {
        CriteriaBuilder criteriaBuilder = em.getCriteriaBuilder();
        CriteriaQuery<Long> criteriaQuery = criteriaBuilder.createQuery(Long.class);

        Root<T> root = criteriaQuery.from(entityClass);
        criteriaQuery.select(criteriaBuilder.count(root));
        criteriaQuery.where(criteriaBuilder.isTrue(root.get("active")));

        Query query = em.createQuery(criteriaQuery);
        return (Long) query.getSingleResult();
    }

    public long countByStatus(String status) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<T> root = cq.from(entityClass);

        cq.select(cb.count(root));
        cq.where(status == null
                ? cb.isNull(root.get("status"))
                : cb.equal(root.get("status"), status));

        return em.createQuery(cq).getSingleResult();
    }

    public List<T> findAllOrderBySth(String orderByField, boolean asc) {
        Map<String, Object> map = new HashMap<>();
        return _findListBySth(map, true, asc, orderByField);
    }

    public List<T> findListBySthOrderBySth(String findByField1, Object value1, String orderByField, boolean asc) {
        Map<String, Object> map = new HashMap<>();
        map.put(findByField1, value1);
        return _findListBySth(map, true, asc, orderByField);
    }

    public List<T> findListBySth2OrderBySth(String findByField1, Object value1, String findByField2, Object value2, String orderByField, boolean asc) {
        Map<String, Object> map = new HashMap<>();
        map.put(findByField1, value1);
        map.put(findByField2, value2);
        return _findListBySth(map, true, asc, orderByField);
    }

    private List<T> _findListBySth(Map<String, Object> nameVals, boolean orderBy, boolean asc, String orderByField) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<T> cq = cb.createQuery(entityClass);
        Root<T> root = cq.from(entityClass);
        List<Predicate> predicates = new ArrayList<>();

        nameVals.forEach((parName, parVal)
                -> predicates.add(Optional.ofNullable(parVal).isPresent()
                        ? cb.equal(root.get(parName), parVal)
                        : cb.isNull(root.get(parName))
                )
        );

        cq.select(root);
        if (!predicates.isEmpty()) {
            cq.where(predicates.toArray(new Predicate[0]));
        }

        // Apply ordering based on provided field
        if (orderBy) {
            if (asc) {
                cq.orderBy(cb.asc(root.get(orderByField)));
            } else {
                cq.orderBy(cb.desc(root.get(orderByField)));
            }
        }

        return em.createQuery(cq).getResultList();
    }

    public T findOneBySth(String findByField1, Object value1) {
        Map<String, Object> map = new HashMap<>();
        map.put(findByField1, value1);
        return this.findOneBySth(map);
    }

    protected T findOneBySth(Map<String, Object> nameVals) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<T> root = cq.from(entityClass);

        List<Predicate> predicates = new ArrayList<>();
        nameVals.forEach((parName, parVal) -> {
            predicates.add(cb.equal(root.get(parName), parVal));
        });
        cq.select(root).where(predicates.toArray(Predicate[]::new));

        T out;
        try {
            out = (T) em.createQuery(cq).getSingleResult();
        } catch (NoResultException exc) {
            out = null;
        }
        return out;
    }

}
